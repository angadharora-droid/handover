import mongoose from 'mongoose';

// One checklist item's state, scoped to a handover and (for room areas) a room.
const entrySchema = new mongoose.Schema(
  {
    handover: { type: mongoose.Schema.Types.ObjectId, ref: 'Handover', required: true, index: true },
    area: { type: String, required: true },
    room: { type: String, default: null }, // null for non-room areas
    itemId: { type: String, required: true },
    status: { type: String, default: '' },
    remarks: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true }
);

entrySchema.index({ handover: 1, area: 1, room: 1, itemId: 1 }, { unique: true });

export const Entry = mongoose.model('Entry', entrySchema);
