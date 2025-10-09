import express from "express";
import Request from "../models/Requests.js";

const router = express.Router();

// POST /api/requests - Create a new request
router.post("/", async (req, res) => {
    try {
        const {title, description, status, createdBy} = req.body;
        if (!title || !createdBy) {
            return res.status(400).json({error: "title and createdBy required"});
        }

        const newRequest = new Request({
            title,
            description: description || "",
            status: status || "open",
            createdBy,
        });

        const saved = await newRequest.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create request" });
    }
});

// GET /api/requests - Fetch all requests with optional filters
router.get("/", async (req, res) => {
    try {
        const { status } = req.query;

        // Build query filter object based on existing schema fields
        const filter = {};

        if (status) {
            filter.status = status;
        }

        // Fetch requests sorted by most recent first (using createdAt timestamp)
        const requests = await Request.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.json(requests);
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({
            error: "Failed to fetch requests",
            message: error.message
        });
    }
});

export default router;