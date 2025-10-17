import { Router } from "express";
import auth from "../middleware/auth.js";
import * as ctrl from "../controllers/users.controller.js";

const r = Router();

// current user profile
r.get("/me", auth, ctrl.getMe);
r.patch("/me", auth, ctrl.updateMe);

export default r;
