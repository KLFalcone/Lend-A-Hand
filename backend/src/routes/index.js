// src/routes/index.js
import { Router } from "express";
import health from "./health.routes.js";
import requests from "./requests.routes.js";
import users from "./user.routes.js";
import auth from "./auth.routes.js";
import notifications from "./notifications.routes.js";
import meRoutes from "./me.routes.js";
import admin from "./admin.routes.js";
import feedback from "./feedback.routes.js";

const r = Router();

r.use("/health", health);
r.use("/auth", auth);
r.use("/requests", requests);
r.use("/users", users);
r.use("/notifications", notifications);
r.use("/me", meRoutes);
r.use("/admin", admin);
r.use("/feedback", feedback);

export default r;
