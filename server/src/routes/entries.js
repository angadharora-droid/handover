import mongoose from 'mongoose';
import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { Entry } from '../models/Entry.js';
import { AuditLog } from '../models/AuditLog.js';
import { CustomItem } from '../models/CustomItem.js';
import { getCurrentHandover } from '../utils/handover.js';
import {
  CHECKLIST,
  isValidItem,
  isValidStatus,
  isRoomArea,
  isValidRoom,
  getItemName,
} from '../data/checklist.js';

// Admins may edit any area; everyone else only the areas assigned to them.
export function canEditArea(user, area) {
  if (!user) return false;
  if (user.role === 'viewer') return false;
  if (user.role === 'admin') return true;
  return (user.assignedAreas || []).includes(area);
}

// Statuses only an administrator may apply.
const ADMIN_ONLY_STATUSES = new Set(['phase2', 'dropped']);

const router = Router();
router.use(authRequired);

function serialize(e) {
  return {
    id: e._id,
    area: e.area,
    room: e.room,
    itemId: e.itemId,
    status: e.status,
    remarks: e.remarks,
    updatedBy: e.updatedBy, // user id — lets the client filter a report by author
    updatedByName: e.updatedByName,
    updatedAt: e.updatedAt,
  };
}

// All saved entries for the current handover (drives every screen + dashboard).
router.get('/', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });
  const entries = await Entry.find({ handover: h._id });
  res.json({ entries: entries.map(serialize) });
});

// Upsert a single item's status / remarks.
router.put('/', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  const { area, itemId } = req.body || {};
  let { room = null, status = '', remarks = '' } = req.body || {};

  if (!CHECKLIST[area]) return res.status(400).json({ error: 'Unknown area' });

  // Section-level permission: only assigned users (or admins) may edit.
  if (!canEditArea(req.user, area)) {
    return res.status(403).json({ error: 'You are not assigned to this section' });
  }

  // Normalise the room: non-room areas always store null.
  room = isRoomArea(area) ? room : null;
  if (!isValidRoom(area, room)) return res.status(400).json({ error: 'Invalid room for this area' });

  // The item is either a static template item or a user-added ("Other") item,
  // whose _id is used as the itemId.
  let itemName;
  if (isValidItem(area, itemId)) {
    itemName = getItemName(area, itemId);
  } else if (mongoose.isValidObjectId(itemId)) {
    const custom = await CustomItem.findOne({ _id: itemId, handover: h._id, area, room });
    if (!custom) return res.status(400).json({ error: 'Unknown item for this area' });
    itemName = custom.name;
  } else {
    return res.status(400).json({ error: 'Unknown item for this area' });
  }

  if (status && !isValidStatus(status)) return res.status(400).json({ error: 'Invalid status' });

  // Phase 2 and Dropped from List can only be set by an administrator.
  if (ADMIN_ONLY_STATUSES.has(status) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only an administrator can set Phase 2 or Dropped from List' });
  }

  status = status || '';
  remarks = remarks || '';

  const prev = await Entry.findOne({ handover: h._id, area, room, itemId });
  const prevStatus = prev?.status || '';
  const prevRemarks = prev?.remarks || '';

  const entry = await Entry.findOneAndUpdate(
    { handover: h._id, area, room, itemId },
    {
      $set: {
        status,
        remarks,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Record an audit entry only when something actually changed.
  if (prevStatus !== status || prevRemarks !== remarks) {
    await AuditLog.create({
      handover: h._id,
      area,
      room,
      itemId,
      itemName,
      oldStatus: prevStatus,
      newStatus: status,
      oldRemarks: prevRemarks,
      newRemarks: remarks,
      userId: req.user._id,
      userName: req.user.name,
    });
  }

  res.json({ entry: serialize(entry) });
});

export default router;
