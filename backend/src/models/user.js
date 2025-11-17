import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },

    // shown in UI as the user's name
    displayName: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // --- profile fields ---
    address: { type: String, default: "", trim: true, maxlength: 200 },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30,
      validate: {
        validator: (v) => !v || /^[\d+\-().\s]+$/.test(v),
        message: "phone contains invalid characters",
      },
    },
    availability: { type: String, default: "", trim: true, maxlength: 200 },
    profilePic: { type: String, default: "", trim: true, maxlength: 500 },

    // --- feedback received as a helper ---
    feedbackReceived: [
      {
        request: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Request",
        },
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: String,
          enum: ["helpful", "not_helpful"],
        },
        comment: {
          type: String,
          trim: true,
          maxlength: 1000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password; // never send hashed password
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// hash password on create/update if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// compare plaintext against hashed password
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);
