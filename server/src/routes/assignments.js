import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { CHECKLIST } from '../data/checklist.js';

const router = Router();
router.use(authRequired, requireRole('admin'));

// Set the full list of users assigned to one area. Stored on each user as
// `assignedAreas`; this keeps the per-request edit check fast (no extra query).
router.put('/:area', async (req, res) => {
  const area = req.params.area;
  if (!CHECKLIST[area]) return res.status(400).json({ error: 'Unknown area' });

  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];

  // Add the area to the selected users, remove it from everyone else.
  await User.updateMany({ _id: { $in: userIds } }, { $addToSet: { assignedAreas: area } });
  await User.updateMany({ _id: { $nin: userIds } }, { $pull: { assignedAreas: area } });

  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users: users.map((u) => u.toSafeJSON()) });
});

export default router;
