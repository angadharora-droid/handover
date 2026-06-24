import mongoose from 'mongoose';

// Append-only record of every change to a checklist item's status or remarks.
const auditLogSchema = new mongoose.Schema(
  {
    handover: { type: mongoose.Schema.Types.ObjectId, ref: 'Handover', required: true, index: true },
    area: { type: String, required: true, index: true },
    room: { type: String, default: null },
    itemId: { type: String, required: true },
    itemName: { type: String, default: '' },
    oldStatus: { type: String, default: '' },
    newStatus: { type: String, default: '' },
    oldRemarks: { type: String, default: '' },
    newRemarks: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
