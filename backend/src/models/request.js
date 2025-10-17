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

    // New location shape (address + [lng, lat] for geospatial queries)
    location: {
      address:     { type: String, required: true, trim: true },
      coordinates: {
        type: [Number], // [lng, lat]
        index: "2dsphere",
        default: undefined, // omit if not provided
        validate: {
          validator: (v) => !v || (Array.isArray(v) && v.length === 2),
          message: "coordinates must be [lng, lat]",
        },
      },
    },

    status: { type: String, enum: ["open", "in_progress", "closed"], default: "open" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

/**
 * Backward-compatibility shim:
 * If older payloads used location.coords.{lat,lng}, normalize them to coordinates [lng, lat].
 */
RequestSchema.pre("validate", function normalizeOldCoords(next) {
  // @ts-ignore
  const legacy = this?.location?.coords;
  if (legacy && typeof legacy.lat === "number" && typeof legacy.lng === "number") {
    // @ts-ignore
    this.location.coordinates = [legacy.lng, legacy.lat];
    // @ts-ignore
    this.location.coords = undefined;
  }
  next();
});

export default mongoose.model("Request", RequestSchema);
