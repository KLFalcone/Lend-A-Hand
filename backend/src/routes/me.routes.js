// backend/src/routes/me.routes.js
import express from "express";
import auth from "../middleware/auth.js";
import Request from "../models/request.js";
import User from "../models/user.js";

const router = express.Router();

router.get("/overview", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // --- requests created by this user ---
    const created = await Request.find({ createdBy: userId })
      .select("_id title status createdAt acceptedBy")
      .sort({ createdAt: -1 })
      .lean();

    // --- requests this user has accepted/helped with ---
    const accepted = await Request.find({ acceptedBy: userId })
      .select("_id title status createdAt createdBy")
      .sort({ createdAt: -1 })
      .lean();

    // --- counts for dashboard stats ---
    const counts = {
      createdOpen: created.filter((r) => r.status !== "closed").length,
      createdClosed: created.filter((r) => r.status === "closed").length,
      helpingNow: accepted.filter((r) => r.status !== "closed").length,
    };

    // --- reputation summary ---
    const userDoc = await User.findById(userId).select("feedbackReceived");
    let avgRating = null;
    let reviewCount = 0;

    if (userDoc && Array.isArray(userDoc.feedbackReceived)) {
      const ratings = userDoc.feedbackReceived
        .map((f) => Number(f.rating))
        .filter((n) => Number.isFinite(n));
      reviewCount = ratings.length;
      if (reviewCount > 0) {
        const sum = ratings.reduce((acc, n) => acc + n, 0);
        avgRating = sum / reviewCount;
      }
    }

    const feedbackSummary = { avgRating, reviewCount };

    res.json({ created, accepted, counts, feedbackSummary });
  } catch (err) {
    console.error("Error in /me/overview:", err);
    res.status(500).json({ error: "Failed to load overview" });
  }
});

export default router;
