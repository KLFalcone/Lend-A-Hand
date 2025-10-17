import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Errand', 'Yardwork', 'Pet Care', 'Tutoring', 'Household', 'Other'],
    },
    urgency: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
    },
    location: {
      address: { type: String, required: true },
      coords: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'closed'],
      default: 'open',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Request', requestSchema);
