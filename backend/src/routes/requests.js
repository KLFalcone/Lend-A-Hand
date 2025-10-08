import express from "express";
import Request from "../models/Requests.js";

const router = express.Router();

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

export default router;