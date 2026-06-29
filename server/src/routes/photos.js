import mongoose from 'mongoose';
import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { Photo } from '../models/Photo.js';
import { CustomItem } from '../models/CustomItem.js';
import { getCurrentHandover } from '../utils/handover.js';
import { CHECKLIST, isValidItem, isRoomArea, isValidRoom } from '../data/checklist.js';
import { canEditArea } from './entries.js';

// A generous cap on the stored data-URL length (~9MB of base64). Images are
// compressed client-side and should land far below this; the limit just guards
// against an oversized payload slipping through.
const MAX_DATA_LEN = 12 * 1024 * 1024;

const router = Router();
router.use(authRequired);

// Metadata + thumbnail only (never the full `data`, which can be large).
function meta(p) {
  return {
    id: p._id,
    area: p.area,
    room: p.room,
    itemId: p.itemId,
    thumb: p.thumb,
    uploadedBy: p.uploadedBy,
    uploadedByName: p.uploadedByName,
    createdAt: p.createdAt,
  };
}

// An item is valid if it's a static template item or a user-added ("Other")
// item whose _id is used as the itemId.
async function itemExists(handover, area, room, itemId) {
  if (isValidItem(area, itemId)) return true;
  if (mongoose.isValidObjectId(itemId)) {
    const custom = await CustomItem.findOne({ _id: itemId, handover: handover._id, area, room });
    return !!custom;
  }
  return false;
}

// List photos (metadata + thumbnails) — optionally scoped to an area/room.
router.get('/', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  const { area } = req.query;
  const q = { handover: h._id };
  if (area) {
    if (!CHECKLIST[area]) return res.status(400).json({ error: 'Unknown area' });
    q.area = area;
    q.room = isRoomArea(area) ? req.query.room || null : null;
  }

  const photos = await Photo.find(q).select('-data').sort({ createdAt: 1 });
  res.json({ photos: photos.map(meta) });
});

// Full image (data URL) for a single photo.
router.get('/:id', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Photo not found' });
  const photo = await Photo.findOne({ _id: req.params.id, handover: h._id });
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  res.json({ photo: { ...meta(photo), data: photo.data } });
});

// Attach a photo to an item.
router.post('/', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  const { area, itemId, data, thumb } = req.body || {};
  let { room = null } = req.body || {};

  if (!CHECKLIST[area]) return res.status(400).json({ error: 'Unknown area' });
  if (!canEditArea(req.user, area)) {
    return res.status(403).json({ error: 'You are not assigned to this section' });
  }

  room = isRoomArea(area) ? room : null;
  if (!isValidRoom(area, room)) return res.status(400).json({ error: 'Invalid room for this area' });
  if (!(await itemExists(h, area, room, itemId))) {
    return res.status(400).json({ error: 'Unknown item for this area' });
  }

  if (typeof data !== 'string' || !data.startsWith('data:image/')) {
    return res.status(400).json({ error: 'A valid image is required' });
  }
  if (data.length > MAX_DATA_LEN) return res.status(413).json({ error: 'Image is too large' });

  const photo = await Photo.create({
    handover: h._id,
    area,
    room,
    itemId,
    data,
    thumb: typeof thumb === 'string' && thumb.startsWith('data:image/') ? thumb : data,
    uploadedBy: req.user._id,
    uploadedByName: req.user.name,
  });
  res.status(201).json({ photo: meta(photo) });
});

// Remove a photo.
router.delete('/:id', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Photo not found' });
  const photo = await Photo.findOne({ _id: req.params.id, handover: h._id });
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  if (!canEditArea(req.user, photo.area)) {
    return res.status(403).json({ error: 'You are not assigned to this section' });
  }

  await Photo.deleteOne({ _id: photo._id });
  res.json({ ok: true });
});

export default router;
