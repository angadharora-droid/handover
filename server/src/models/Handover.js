import mongoose from 'mongoose';

const handoverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, default: '' },
    location: { type: String, default: '' },
    giver: { type: String, default: 'Hariganga' },
    receiver: { type: String, default: 'Centre Point Hospitality' },
    finalised: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Handover = mongoose.model('Handover', handoverSchema);
