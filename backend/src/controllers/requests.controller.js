// backend/src/controllers/requests.controller.js
import Request from "../models/request.js";
import User from "../models/user.js";
import { createNotification } from "./notifications.controller.js";
import { sendEmail } from "../services/emailService.js";

/* utils */
const toNum = (v) => (v === undefined ? undefined : Number(v));
const isFiniteNum = (v) => Number.isFinite(toNum(v));

/**
 * Haversine distance between two lat/lng points in meters
 */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // earth radius in meters
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/v1/requests
 * Query params:
 *   status=open
 *   tag=Errand  (alias of category)
 *   category=Errand
 *   urgency=low|medium|high
 *   state=Virginia (matches in location.address)
 *   lat=39.04&lng=-77.48&maxDistance=5000  (meters; optional)
 */
export async function list(req, res, next) {
  try {
    const {
      status,
      tag,
      category,
      lat,
      lng,
      maxDistance,
      urgency,
      state,
    } = req.query;

    const q = {};
    if (status) q.status = status;
    // support either ?tag= or ?category=
    if (tag) q.category = tag;
    if (category) q.category = category;
    if (urgency) q.urgency = urgency;

    // optional state filter (matches state name in address, case-insensitive)
    if (state) {
      q["location.address"] = new RegExp(state, "i");
    }

    const hasGeo =
      lat !== undefined &&
      lng !== undefined &&
      isFiniteNum(lat) &&
      isFiniteNum(lng) &&
      isFiniteNum(maxDistance);

    // If we have geo filters, do manual distance filtering in Node
    if (hasGeo) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      const maxDistNum = Number(maxDistance);

      const docs = await Request.find(q)
        .sort({ createdAt: -1 })
        .populate("createdBy", "displayName email")
        .populate("acceptedBy", "displayName email")
        .lean();

      const filtered = docs.filter((doc) => {
        const coords = doc.location?.coordinates;
        if (
          !coords ||
          !Array.isArray(coords) ||
          coords.length < 2 ||
          !isFiniteNum(coords[0]) ||
          !isFiniteNum(coords[1])
        ) {
          return false;
        }

        const [lng2, lat2] = coords;
        const d = distanceMeters(latNum, lngNum, lat2, lng2);
        return d <= maxDistNum;
      });

      return res.json(filtered);
    }

    // No geo filters: regular query
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
          const meta = {
            requestId: doc._id,
            partnerEmail: req.user.email,
            partnerName: actor,
          };

          if (newStatus === "in_progress") {
            await createNotification({
              recipientId,
              type: "request_accepted",
              message: `${actor} accepted your request "${before.title}".`,
              meta,
            });
          } else if (newStatus === "closed") {
            await createNotification({
              recipientId,
              type: "request_completed",
              message: `${actor} marked your request "${before.title}" as completed.`,
              meta,
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
    const { id } = req.params;

    const doc = await Request.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "not found" });
    }

    const userId = req.user?._id?.toString();
    const isAdmin = req.user?.role === "admin";
    const isOwner =
      userId && doc.createdBy && doc.createdBy.toString() === userId;

    // only the owner or an admin can delete
    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this request" });
    }

    await doc.deleteOne();
    return res.status(200).json({ message: "Request deleted" });
  } catch (e) {
    next(e);
  }
}

/** PATCH /api/v1/requests/:id/accept */
export async function acceptRequest(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await Request.findById(id).populate(
      "createdBy",
      "displayName email"
    );
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status !== "open" && request.acceptedBy) {
      return res
        .status(400)
        .json({ message: "Request already accepted or closed" });
    }

    if (String(request.createdBy._id || request.createdBy) === String(userId)) {
      return res
        .status(400)
        .json({ message: "You cannot accept your own request" });
    }

    request.status = "in_progress";
    request.acceptedBy = userId;
    await request.save();

    const actor = req.user.displayName || req.user.email;

    // notify requester
    await createNotification({
      recipientId: request.createdBy._id || request.createdBy,
      type: "request_accepted",
      message: `${actor} accepted your request "${request.title}".`,
      meta: {
        requestId: request._id,
        partnerEmail: req.user.email,
        partnerName: actor,
      },
    });

    // email accepter
    await sendEmail({
      to: req.user.email,
      subject: "You just accepted a request",
      body: `Hi ${actor}, you just accepted request "${request.title}".`,
    });

    // email requester
    await sendEmail({
      to: request.createdBy.email,
      subject: "Your request was just accepted",
      body: `Hi ${request.createdBy.displayName}, your request "${request.title}" was just accepted by ${actor}.`,
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

    const request = await Request.findById(id).populate(
      "createdBy",
      "displayName email"
    );
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (req.user._id.toString() === request.createdBy._id.toString()) {
      return res.status(403).json({
        message: "Requester cannot mark their own request complete",
      });
    }

    if (request.status === "closed") {
      return res.status(400).json({ message: "Request already closed" });
    }

    request.status = "pending_confirmation";
    request.completedBy = req.user._id;

    // set the actual completion time when the helper marks it complete
    if (!request.completedAt) {
      request.completedAt = new Date();
    }

    await request.save();

    const actor = req.user.displayName || req.user.email;

    // notify requester (includes requestId for bell Confirm)
    await createNotification({
      recipientId: request.createdBy._id,
      type: "request_pending_confirmation",
      message: `${actor} marked your request "${request.title}" as complete. Please confirm.`,
      meta: {
        requestId: request._id,
        partnerEmail: req.user.email,
        partnerName: actor,
      },
    });

    // email requester
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

    const request = await Request.findById(id)
      .populate("createdBy", "displayName email")
      .populate("completedBy", "displayName email");
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (req.user._id.toString() !== request.createdBy._id.toString()) {
      return res.status(403).json({
        message: "Only the requester can confirm completion",
      });
    }

    if (request.status !== "pending_confirmation") {
      return res
        .status(400)
        .json({ message: "Request is not pending confirmation" });
    }

    request.status = "closed";

    // keep the original completion time if it exists; otherwise set a fallback
    if (!request.completedAt) {
      request.completedAt = new Date();
    }

    await request.save();

    // notify helper (acceptedBy / completedBy)
    if (request.completedBy) {
      await createNotification({
        recipientId: request.completedBy._id || request.completedBy,
        type: "request_closed",
        message: `${
          req.user.displayName || req.user.email
        } confirmed completion of "${request.title}".`,
        meta: {
          requestId: request._id,
          partnerEmail: request.createdBy.email,
          partnerName:
            request.createdBy.displayName || request.createdBy.email,
        },
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
    if (
      !request.acceptedBy ||
      request.acceptedBy._id.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You cannot cancel this request" });
    }

    // only cancel if in progress
    if (request.status !== "in_progress") {
      return res.status(400).json({
        message: "Cannot cancel a request that is not in progress",
      });
    }

    request.acceptedBy = undefined;
    request.status = "open";
    await request.save();

    const actor = req.user.displayName || req.user.email;

    // notify requester
    await createNotification({
      recipientId: request.createdBy._id,
      type: "request_canceled",
      message: `${actor} canceled helping with "${request.title}". It's open again.`,
      meta: {
        requestId: request._id,
        partnerEmail: req.user.email,
        partnerName: actor,
      },
    });

    // optional email to requester
    await sendEmail({
      to: request.createdBy.email,
      subject: "Helper canceled your request",
      body: `Your request "${request.title}" is now open again because ${actor} canceled.`,
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
    const latNum = Number(lat);
    const lngNum = Number(lng);

    const match = {};
    if (status) match.status = status;
    if (tag) match.category = tag;
    if (category) match.category = category;

    const docs = await Request.find(match).lean();

    const results = docs
      .map((doc) => {
        const coords = doc.location?.coordinates;
        if (
          !coords ||
          !Array.isArray(coords) ||
          coords.length < 2 ||
          !isFiniteNum(coords[0]) ||
          !isFiniteNum(coords[1])
        ) {
          return null;
        }

        const [lng2, lat2] = coords;
        const d = distanceMeters(latNum, lngNum, lat2, lng2);
        return { ...doc, distance: d };
      })
      .filter((doc) => doc && (Number.isFinite(md) ? doc.distance <= md : true))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 100);

    res.json({ results });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/v1/requests/:id/feedback
 * Body: { rating: 1-5, comment?: string }
 * Only the requester can leave feedback, and only once, after the request is closed.
 */
export async function submitFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body || {};

    const numericRating = Number(rating);
    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({ message: "Invalid rating value" });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only requester can submit feedback
    if (req.user._id.toString() !== request.createdBy.toString()) {
      return res
        .status(403)
        .json({ message: "Only the requester can submit feedback" });
    }

    // Only after request is closed
    if (request.status !== "closed") {
      return res.status(400).json({
        message: "Feedback can only be left after the request is closed",
      });
    }

    // Prevent multiple feedbacks from same user on same request
    const existing =
      Array.isArray(request.feedback) &&
      request.feedback.find(
        (f) => f.from && f.from.toString() === req.user._id.toString()
      );
    if (existing) {
      return res
        .status(400)
        .json({ message: "Feedback already submitted for this request" });
    }

    const feedbackEntry = {
      from: req.user._id,
      rating: numericRating,
      comment: comment || "",
      createdAt: new Date(),
    };

    if (!Array.isArray(request.feedback)) {
      request.feedback = [];
    }
    request.feedback.push(feedbackEntry);
    await request.save();

    // Also store summary on the helper's user record, if we know who helped
    const helperId = request.completedBy || request.acceptedBy;
    if (helperId) {
      await User.findByIdAndUpdate(helperId, {
        $push: {
          feedbackReceived: {
            request: request._id,
            from: req.user._id,
            rating: numericRating,
            comment: comment || "",
            createdAt: new Date(),
          },
        },
      }).catch((err) => {
        console.error("Failed to push feedbackReceived on user:", err?.message);
      });
    }

    // Optional: notify helper they got feedback
    if (helperId) {
      try {
        await createNotification({
          recipientId: helperId,
          type: "request_feedback",
          message: `${
            req.user.displayName || req.user.email
          } left feedback on "${request.title}".`,
          meta: {
            requestId: request._id,
            partnerEmail: req.user.email,
            partnerName: req.user.displayName || req.user.email,
          },
        });
      } catch (notifyErr) {
        console.error(
          "Failed to create feedback notification:",
          notifyErr?.message
        );
      }
    }

    return res.status(201).json({
      message: "Feedback submitted",
      request,
    });
  } catch (e) {
    next(e);
  }
}
