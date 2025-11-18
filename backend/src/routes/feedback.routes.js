import { Router } from "express";
import auth from "../middleware/auth.js";
import { getUserFeedback } from "../controllers/feedback.controller.js";

const r = Router();

// All feedback APIs require login for now
r.use(auth);

// GET /api/v1/feedback/user/:id
r.get("/user/:id", getUserFeedback);

export default r;
