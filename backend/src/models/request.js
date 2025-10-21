import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    category: {
      type: String,
      required: true,
      enum: ["Errand", "Yardwork", "Pet Care", "Tutoring", "Household", "Other"],
    },

    urgency: { type: String, required: true, enum: ["low", "medium", "high"] },

    // Address plus [lng, lat] for geospatial queries
    location: {
      address:     { type: String, required: true, trim: true },
      coordinates: {
        type: [Number],                  // [lng, lat]
        index: "2dsphere",
        default: undefined,              // omit if not provided
        validate: {
          validator: (v) => !v || (Array.isArray(v) && v.length === 2),
          message: "coordinates must be [lng, lat]",
        },
      },
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "pending_confirmation", "closed"],
      default: "open",
    },

    // Who created the request
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Who accepted (any user can be helper)
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Completion metadata
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },

    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

/**
 * Backward-compatibility shim:
 * If older payloads used location.coords.{lat,lng}, normalize to coordinates [lng, lat].
 */
RequestSchema.pre("validate", function normalizeOldCoords(next) {
  const legacy = this?.location?.coords;
  if (legacy && typeof legacy.lat === "number" && typeof legacy.lng === "number") {
    this.location.coordinates = [legacy.lng, legacy.lat];
    this.location.coords = undefined;
  }
  next();
});

export default mongoose.model("Request", RequestSchema);
