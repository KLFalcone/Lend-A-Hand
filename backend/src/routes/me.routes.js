import express from "express";
import Request from "../models/request.js";
import auth from "../middleware/auth.js";

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
      createdOpen: created.filter(r => r.status !== "closed").length,
      createdClosed: created.filter(r => r.status === "closed").length,
      helpingNow: accepted.filter(r => r.status !== "closed").length,
    };

    res.json({ created, accepted, counts });
  } catch (err) {
    console.error("Error in /me/overview:", err);
    res.status(500).json({ error: "Failed to load overview" });
  }
});

export default router;
