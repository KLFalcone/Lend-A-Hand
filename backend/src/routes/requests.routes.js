import { Router } from "express";
import auth from "../middleware/auth.js";
import * as ctrl from "../controllers/requests.controller.js";

const r = Router();

// public browse helpers
r.get("/near", ctrl.getNearbyRequests);
r.get("/", ctrl.list);
r.get("/:id", ctrl.getOne);

// create + updates (auth required)
r.post("/", auth, ctrl.create);
r.patch("/:id", auth, ctrl.update);
r.patch("/:id/accept", auth, ctrl.acceptRequest);
r.patch("/:id/complete", auth, ctrl.markComplete);
r.patch("/:id/confirm", auth, ctrl.confirmCompletion);
r.patch("/:id/cancel", auth, ctrl.cancelAcceptance);

// feedback (auth required, requester only – enforced in controller)
r.post("/:id/feedback", auth, ctrl.submitFeedback);

// delete (auth + owner/admin checked inside controller)
r.delete("/:id", auth, ctrl.remove);

export default r;
