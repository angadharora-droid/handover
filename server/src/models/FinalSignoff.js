import mongoose from 'mongoose';

const partySchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    designation: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const finalSignoffSchema = new mongoose.Schema(
  {
    handover: { type: mongoose.Schema.Types.ObjectId, ref: 'Handover', required: true, unique: true },
    hariganga: { type: partySchema, default: null },
    cph: { type: partySchema, default: null },
    finalisedAt: { type: Date },
  },
  { timestamps: true }
);

export const FinalSignoff = mongoose.model('FinalSignoff', finalSignoffSchema);
