import Notification from "../models/notification.js";

export async function createNotification({ recipientId, message, type = "info", meta = {} }) {
  if (!recipientId || !message) return null;
  return Notification.create({ recipientId, message, type, meta });
}

/** GET /api/v1/notifications  (auth) */
export async function listMyNotifications(req, res, next) {
  try {
    const items = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(items);
  } catch (e) { next(e); }
}

/** PATCH /api/v1/notifications/:id/read (auth) */
export async function markRead(req, res, next) {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: "not found" });
    res.json(n);
  } catch (e) { next(e); }
}

/** PATCH /api/v1/notifications/read-all (auth) */
export async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ recipientId: req.user._id, isRead: false }, { isRead: true });
    res.status(204).end();
  } catch (e) { next(e); }
}
