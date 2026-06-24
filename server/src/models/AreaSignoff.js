import mongoose from 'mongoose';

const sideSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signedAt: { type: Date },
  },
  { _id: false }
);

const areaSignoffSchema = new mongoose.Schema(
  {
    handover: { type: mongoose.Schema.Types.ObjectId, ref: 'Handover', required: true, index: true },
    area: { type: String, required: true },
    hariganga: { type: sideSchema, default: null },
    cph: { type: sideSchema, default: null },
  },
  { timestamps: true }
);

areaSignoffSchema.index({ handover: 1, area: 1 }, { unique: true });

export const AreaSignoff = mongoose.model('AreaSignoff', areaSignoffSchema);
