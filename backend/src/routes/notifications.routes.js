import { Router } from "express";
import auth from "../middleware/auth.js";
import { listMyNotifications, markRead, markAllRead } from "../controllers/notifications.controller.js";

const r = Router();
r.use(auth);

r.get("/", listMyNotifications);
r.patch("/:id/read", markRead);
r.patch("/read-all", markAllRead);

export default r;
