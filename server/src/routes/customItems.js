import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { CustomItem } from '../models/CustomItem.js';
import { Entry } from '../models/Entry.js';
import { getCurrentHandover } from '../utils/handover.js';
import { CHECKLIST, isRoomArea, isValidRoom } from '../data/checklist.js';
import { canEditArea } from './entries.js';

const router = Router();
router.use(authRequired);

function serialize(c) {
  return {
    id: c._id,
    area: c.area,
    room: c.room,
    name: c.name,
    createdByName: c.createdByName,
    createdAt: c.createdAt,
  };
}

// All custom items for the current handover (client groups by area + room).
router.get('/', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });
  const items = await CustomItem.find({ handover: h._id }).sort({ createdAt: 1 });
  res.json({ items: items.map(serialize) });
});

router.post('/', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  const { area, name } = req.body || {};
  let { room = null } = req.body || {};

  if (!CHECKLIST[area]) return res.status(400).json({ error: 'Unknown area' });
  if (!canEditArea(req.user, area)) {
    return res.status(403).json({ error: 'You are not assigned to this section' });
  }
  room = isRoomArea(area) ? room : null;
  if (!isValidRoom(area, room)) return res.status(400).json({ error: 'Invalid room for this area' });
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Item name is required' });

  const item = await CustomItem.create({
    handover: h._id,
    area,
    room,
    name: String(name).trim(),
    createdBy: req.user._id,
    createdByName: req.user.name,
  });
  res.status(201).json({ item: serialize(item) });
});

router.delete('/:id', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  const item = await CustomItem.findOne({ _id: req.params.id, handover: h._id });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (!canEditArea(req.user, item.area)) {
    return res.status(403).json({ error: 'You are not assigned to this section' });
  }

  // Remove the item and any saved state attached to it.
  await CustomItem.deleteOne({ _id: item._id });
  await Entry.deleteOne({ handover: h._id, area: item.area, room: item.room, itemId: String(item._id) });
  res.json({ ok: true });
});

export default router;
