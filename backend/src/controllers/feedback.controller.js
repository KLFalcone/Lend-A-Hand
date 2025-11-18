import Request from "../models/request.js";

/**
 * Normalize any stored rating into a 1–5 numeric value.
 * Supports legacy "helpful"/"not_helpful" in addition to numbers.
 */
function toNumericRating(rating) {
  if (typeof rating === "number") return rating;
  if (rating === "helpful") return 5;
  if (rating === "not_helpful") return 2; // tweak if you want harsher
  return null;
}

/**
 * GET /api/v1/feedback/user/:id
 * Returns all feedback entries for a given helper (id),
 * plus a small summary (avg rating + review count).
 */
export async function getUserFeedback(req, res, next) {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User id is required" });
    }

    const requests = await Request.find({
      $and: [
        {
          $or: [{ completedBy: userId }, { acceptedBy: userId }],
        },
        { "feedback.0": { $exists: true } },
      ],
    })
      .populate("createdBy", "displayName email")
      .populate("acceptedBy", "displayName email")
      .populate("completedBy", "displayName email")
      .populate("feedback.from", "displayName email")
      .sort({ "feedback.createdAt": -1 })
      .lean();

    const items = [];
    let total = 0;
    let sum = 0;

    for (const r of requests) {
      const helperUser = r.completedBy || r.acceptedBy || null;
      const requesterUser = r.createdBy || null;

      if (!Array.isArray(r.feedback)) continue;

      for (const fb of r.feedback) {
        if (!fb || !fb.from) continue;

        const numericRating = toNumericRating(fb.rating);
        if (numericRating != null) {
          total += 1;
          sum += numericRating;
        }

        items.push({
          requestId: r._id,
          requestTitle: r.title,
          requestStatus: r.status,
          rating: numericRating,
          rawRating: fb.rating,
          comment: fb.comment || "",
          createdAt: fb.createdAt || r.createdAt,
          reviewer: {
            _id: fb.from._id,
            displayName: fb.from.displayName || fb.from.email,
            email: fb.from.email,
          },
          helper: helperUser
            ? {
                _id: helperUser._id,
                displayName: helperUser.displayName || helperUser.email,
                email: helperUser.email,
              }
            : null,
          requester: requesterUser
            ? {
                _id: requesterUser._id,
                displayName: requesterUser.displayName || requesterUser.email,
                email: requesterUser.email,
              }
            : null,
        });
      }
    }

    const avgRating = total > 0 ? sum / total : null;

    res.json({
      items,
      summary: {
        reviewCount: total,
        avgRating,
      },
    });
  } catch (e) {
    next(e);
  }
}
