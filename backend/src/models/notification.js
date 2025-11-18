import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true, maxlength: 200 },
    type: {
      type: String,
      default: "info", // e.g. "request_accepted", "request_feedback"
    },
    isRead: { type: Boolean, default: false },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
