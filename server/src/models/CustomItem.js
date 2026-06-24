import mongoose from 'mongoose';

// A user-added ("Other") checklist item, scoped to an area and — for room
// areas — a specific room. Its _id doubles as the itemId used by Entry/AuditLog.
const customItemSchema = new mongoose.Schema(
  {
    handover: { type: mongoose.Schema.Types.ObjectId, ref: 'Handover', required: true, index: true },
    area: { type: String, required: true },
    room: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
);

export const CustomItem = mongoose.model('CustomItem', customItemSchema);
