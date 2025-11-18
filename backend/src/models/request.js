import mongoose from "mongoose";

// Individual feedback entries stored on each Request
const FeedbackSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 1–5 star rating instead of thumbs up / down
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const RequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    category: {
      type: String,
      required: true,
      enum: ["Errand", "Yardwork", "Pet Care", "Tutoring", "Household", "Other"],
    },

    urgency: { type: String, required: true, enum: ["low", "medium", "high"] },

    // GeoJSON location: used for geospatial queries ($near)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: false,
      },
      address: {
        type: String,
        trim: true,
      },
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "pending_confirmation", "closed"],
      default: "open",
    },

    // Who created the request
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who accepted (any user can be helper)
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Completion metadata
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },

    tags: { type: [String], default: [] },

    // Feedback entries left by requesters about the helper
    feedback: {
      type: [FeedbackSchema],
      default: [],
    },

    flagged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/**
 * Backward-compatibility shim:
 * If older payloads used location.coords.{lat,lng}, normalize to GeoJSON.
 */
RequestSchema.pre("validate", function normalizeOldCoords(next) {
  const legacy = this?.location?.coords;
  if (legacy && typeof legacy.lat === "number" && typeof legacy.lng === "number") {
    this.location = {
      type: "Point",
      coordinates: [legacy.lng, legacy.lat],
      address: this.location?.address,
    };
  } else if (!this.location?.type) {
    // ensure type is present for new/edited docs
    this.location = { ...this.location, type: "Point" };
  }
  next();
});

// Correct 2dsphere index on the GeoJSON object (not coordinates)
RequestSchema.index({ location: "2dsphere" });

export default mongoose.model("Request", RequestSchema);
