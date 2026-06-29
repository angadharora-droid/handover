import mongoose from 'mongoose';

// An optional photo attached to a checklist item, scoped to a handover and (for
// room areas) a room. Images are compressed client-side and stored as JPEG data
// URLs: `thumb` (small, sent in list responses) + `data` (full, fetched on view).
const photoSchema = new mongoose.Schema(
  {
    handover: { type: mongoose.Schema.Types.ObjectId, ref: 'Handover', required: true, index: true },
    area: { type: String, required: true },
    room: { type: String, default: null }, // null for non-room areas
    itemId: { type: String, required: true },
    data: { type: String, required: true }, // full compressed image (data URL)
    thumb: { type: String, required: true }, // small thumbnail (data URL)
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedByName: { type: String, default: '' },
  },
  { timestamps: true }
);

photoSchema.index({ handover: 1, area: 1, room: 1, itemId: 1 });

export const Photo = mongoose.model('Photo', photoSchema);
