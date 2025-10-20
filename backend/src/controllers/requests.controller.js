import Request from "../models/request.js";
import { createNotification } from "./notifications.controller.js";

// GET /api/v1/requests
// Supports simple filters: ?status=open&tag=yard
export async function list(req, res, next) {
  try {
    const { status, tag } = req.query;

    const query = {};
    if (status) query.status = status;
    if (tag) query.tags = tag;

    const items = await Request.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "displayName email"); // show creator name/email

    res.json(items);
  } catch (e) {
    next(e);
  }
}

// POST /api/v1/requests (auth required)
// Creates a request owned by the logged-in user
export async function create(req, res, next) {
  try {
    const doc = await Request.create({
      ...req.body,
      createdBy: req.user?._id, // set owner to current user
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

// GET /api/v1/requests/:id
export async function getOne(req, res, next) {
  try {
    const doc = await Request.findById(req.params.id)
      .populate("createdBy", "displayName email");
    if (!doc) return res.status(404).json({ message: "not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// PATCH /api/v1/requests/:id (auth required)
export async function update(req, res, next) {
  try {
    const { id } = req.params;

    // never allow changing ownership via API
    if ("createdBy" in req.body) delete req.body.createdBy;

    // read current values so we can compare after update (for notifications)
    const before = await Request.findById(id).select("status title createdBy");
    if (!before) return res.status(404).json({ message: "not found" });

    const doc = await Request.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate("createdBy", "displayName email");

    // Fire-and-forget notifications when status changes
    try {
      const newStatus = req.body?.status;
      const changed = newStatus && newStatus !== before.status;
      const recipientId = before.createdBy;

      // don't notify if we can't determine a recipient
      if (changed && recipientId) {
        // optional: don't notify user about their own action
        const isSelf = req.user?._id?.toString() === recipientId.toString();
        if (!isSelf) {
          const actor = req.user?.displayName || req.user?.email || "Someone";
          if (newStatus === "in_progress") {
            await createNotification({
              recipientId,
              type: "request_accepted",
              message: `${actor} accepted your request "${before.title}".`,
            });
          } else if (newStatus === "closed") {
            await createNotification({
              recipientId,
              type: "request_completed",
              message: `${actor} marked your request "${before.title}" as completed.`,
            });
          }
        }
      }
    } catch (e) {
      // never block the main flow on notify errors
      console.error("notify on request update failed:", e?.message);
    }

    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// DELETE /api/v1/requests/:id (auth required)
export async function remove(req, res, next) {
  try {
    const doc = await Request.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "not found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

// PATCH /requests/:id/complete
export async function markComplete(req, res, next) {
  try {
    const { id } = req.params;

    const request = await Request.findById(id).populate("createdBy", "displayName email");
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Only allow volunteers to mark complete (not the requester)
    if (req.user._id.toString() === request.createdBy._id.toString()) {
      return res.status(403).json({ message: "Requester cannot mark their own request complete" });
    }

    if (request.status === "closed") {
      return res.status(400).json({ message: "Request already closed" });
    }

    request.status = "pending_confirmation";
    request.completedBy = req.user._id;
    await request.save();

    // notify requester
    await createNotification({
      recipientId: request.createdBy._id,
      type: "request_pending_confirmation",
      message: `${req.user.displayName || req.user.email} marked your request "${request.title}" as complete. Please confirm.`,
// PATCH /api/v1/requests/:id/accept
export async function acceptRequest(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "open") return res.status(400).json({ message: "Request already accepted or closed" });

    request.status = "in_progress";
    request.volunteer = userId;
    await request.save();

    // Notify the request creator
    await createNotification({
      recipientId: request.createdBy,
      type: "request_accepted",
      message: `${req.user.displayName || req.user.email} accepted your request "${request.title}".`,
    });

    res.json(request);
  } catch (e) {
    next(e);
  }
}

// PATCH /requests/:id/confirm
export async function confirmCompletion(req, res, next) {
  try {
    const { id } = req.params;

    const request = await Request.findById(id).populate("createdBy", "displayName email");
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Only requester can confirm
    if (req.user._id.toString() !== request.createdBy._id.toString()) {
      return res.status(403).json({ message: "Only the requester can confirm completion" });
    }

    if (request.status !== "pending_confirmation") {
      return res.status(400).json({ message: "Request is not pending confirmation" });
    }

    request.status = "closed";
    request.completedAt = new Date();
    await request.save();

    // notify volunteer
    if (request.completedBy) {
      await createNotification({
        recipientId: request.completedBy,
        type: "request_closed",
        message: `${req.user.displayName || req.user.email} confirmed completion of "${request.title}".`,
      });
    }

    res.json(request);
  } catch (e) {
    next(e);
  }
}
