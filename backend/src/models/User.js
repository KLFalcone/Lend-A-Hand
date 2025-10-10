import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // --- Profile fields ---
    name: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    availability: { type: String, default: "" },
    profilePic: { type: String, default: "" },
  },
  { timestamps: true }
);

// Helpful unique index! if it doesn't exist yet Atlas will build it
userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);
