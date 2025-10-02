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
    password: { type: String, required: true }, // store hashed pw
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Helpful unique index! if it doesn't exist yet Atlas will build it
userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);
