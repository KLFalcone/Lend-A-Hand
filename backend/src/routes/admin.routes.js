import { Router } from "express";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import * as ctrl from "../controllers/admin.controller.js";

const r = Router();

// All admin routes require authentication AND admin privileges
r.use(auth, adminAuth);

// User management
r.get("/users", ctrl.getAllUsers);
r.patch("/users/:id", ctrl.updateUser);
r.delete("/users/:id", ctrl.deleteUser);

// Request management
r.get("/requests", ctrl.getAllRequests);
r.patch("/requests/:id", ctrl.updateRequest);
r.delete("/requests/:id", ctrl.deleteRequest);

export default r;