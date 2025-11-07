import Request from "../models/request.js";
import { createNotification } from "./notifications.controller.js";
import { sendEmail } from "../services/emailService.js";

/* utils */
const toNum = (v) => (v === undefined ? undefined : Number(v));
const isFiniteNum = (v) => Number.isFinite(toNum(v));

/**
 * GET /api/v1/requests
 * Query params:
 *   status=open
 *   tag=Errand  (alias of category)
 *   category=Errand
 *   lat=39.04&lng=-77.48&maxDistance=5000  (meters; optional)
 */
export async function list(req, res, next) {
  try {
    const { status, tag, category, lat, lng, maxDistance } = req.query;

    const q = {};
    if (status) q.status = status;
    // support either ?tag= or ?category=
    if (tag) q.category = tag;
    if (category) q.category = category;

    const hasGeo =
      lat !== undefined &&
      lng !== undefined &&
      isFiniteNum(lat) &&
      isFiniteNum(lng) &&
      isFiniteNum(maxDistance);

    if (hasGeo) {
      q.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(maxDistance), // meters
        },
      };
    }

    const items = await Request.find(q)
      .sort({ createdAt: -1 })
      .populate("createdBy", "displayName email")
      .populate("acceptedBy", "displayName email");

    res.json(items);
  } catch (e) {
    next(e);
  }
}

/** POST /api/v1/requests (auth required) */
export async function create(req, res, next) {
  try {
    const doc = await Request.create({
      ...req.body,
      createdBy: req.user?._id,
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

/** GET /api/v1/requests/:id */
export async function getOne(req, res, next) {
  try {
    const doc = await Request.findById(req.params.id)
      .populate("createdBy", "displayName email")
      .populate("acceptedBy", "displayName email");
    if (!doc) return res.status(404).json({ message: "not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

/** PATCH /api/v1/requests/:id (auth required) */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    if ("createdBy" in req.body) delete req.body.createdBy;

    const before = await Request.findById(id).select("status title createdBy");
    if (!before) return res.status(404).json({ message: "not found" });

    const doc = await Request.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "displayName email");

    // best-effort notifications on status change
    try {
      const newStatus = req.body?.status;
      const changed = newStatus && newStatus !== before.status;
      const recipientId = before.createdBy;

      if (changed && recipientId) {
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
    } catch (notifyErr) {
      console.error("notify on request update failed:", notifyErr?.message);
    }

    res.json(doc);
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/v1/requests/:id (auth required) */
export async function remove(req, res, next) {
  try {
    const doc = await Request.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "not found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

/** PATCH /api/v1/requests/:id/accept */
export async function acceptRequest(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== "open" && request.acceptedBy) {
      return res.status(400).json({ message: "Request already accepted or closed" });
    }

    if (String(request.createdBy) === String(userId)) {
      return res.status(400).json({ message: "You cannot accept your own request" });
    }

    request.status = "in_progress";
    request.acceptedBy = userId;
    await request.save();

    // notify requester
    await createNotification({
      recipientId: request.createdBy,
      type: "request_accepted",
      message: `${req.user.displayName || req.user.email} accepted your request "${request.title}".`,
    });

    // email accepter
    await sendEmail({
      to: req.user.email,
      subject: "You just accepted a request",
      body: `Hi ${req.user.displayName}, you just accepted request "${request.title}".`,
    });

    // email requester
    const requestCreator = await Request.findById(id).populate("createdBy");
    await sendEmail({
      to: requestCreator.createdBy.email,
      subject: "Your request was just accepted",
      body: `Hi ${requestCreator.createdBy.displayName}, your request "${request.title}" was just accepted by ${req.user.displayName}.`,
    });

    res.json(request);
  } catch (e) {
    next(e);
  }
}

/** PATCH /api/v1/requests/:id/complete */
export async function markComplete(req, res, next) {
  try {
    const { id } = req.params;

    const request = await Request.findById(id).populate("createdBy", "displayName email");
    if (!request) return res.status(404).json({ message: "Request not found" });

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
    });

    // email requester (fixed template string + signature)
    await sendEmail({
      to: request.createdBy.email,
      subject: "Your request was just completed",
      body: `Hi ${request.createdBy.displayName}, your request "${request.title}" was just marked complete.`,
    });

    res.json(request);
  } catch (e) {
    next(e);
  }
}

/** PATCH /api/v1/requests/:id/confirm */
export async function confirmCompletion(req, res, next) {
  try {
    const { id } = req.params;

    const request = await Request.findById(id).populate("createdBy", "displayName email");
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (req.user._id.toString() !== request.createdBy._id.toString()) {
      return res.status(403).json({ message: "Only the requester can confirm completion" });
    }

    if (request.status !== "pending_confirmation") {
      return res.status(400).json({ message: "Request is not pending confirmation" });
    }

    request.status = "closed";
    request.completedAt = new Date();
    await request.save();

    // notify helper (acceptedBy/completedBy)
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

/** PATCH /api/v1/requests/:id/cancel */
export async function cancelAcceptance(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await Request.findById(id)
      .populate("createdBy", "displayName email")
      .populate("acceptedBy", "displayName email");

    if (!request) return res.status(404).json({ message: "Request not found" });

    // only the volunteer who accepted it can cancel
    if (!request.acceptedBy || request.acceptedBy._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You cannot cancel this request" });
    }

    // only cancel if in progress
    if (request.status !== "in_progress") {
      return res.status(400).json({ message: "Cannot cancel a request that is not in progress" });
    }

    request.acceptedBy = undefined;
    request.status = "open";
    await request.save();

    // notify requester
    await createNotification({
      recipientId: request.createdBy._id,
      type: "request_canceled",
      message: `${req.user.displayName || req.user.email} canceled helping with "${request.title}". It's open again.`,
    });

    // optional email to requester
    await sendEmail({
      to: request.createdBy.email,
      subject: "Helper canceled your request",
      body: `Your request "${request.title}" is now open again because ${req.user.displayName || req.user.email} canceled.`,
    });

    res.json(request);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/v1/requests/near
 * lat, lng required; maxDistance optional (meters)
 * accepts status, tag, category
 */
export async function getNearbyRequests(req, res, next) {
  try {
    const { lat, lng, maxDistance = 5000, status, tag, category } = req.query;
    if (!(lat && lng) || !isFiniteNum(lat) || !isFiniteNum(lng)) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const md = Number(maxDistance);
    const match = {};
    if (status) match.status = status;
    if (tag) match.category = tag;
    if (category) match.category = category;

    const results = await Request.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          distanceField: "distance",
          spherical: true,
          ...(Number.isFinite(md) ? { maxDistance: md } : {}),
        },
      },
      { $match: match },
      { $limit: 100 },
    ]);

    res.json({ results });
  } catch (e) {
    next(e);
  }
}
