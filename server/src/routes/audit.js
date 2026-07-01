import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import { AuditLog } from '../models/AuditLog.js';
import { getCurrentHandover } from '../utils/handover.js';

const router = Router();
router.use(authRequired, requireRole('admin'));

// Recent change history, newest first. Optional ?area= and ?userId= filters.
router.get('/', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  const filter = { handover: h._id };
  if (req.query.area) filter.area = req.query.area;
  if (req.query.userId) filter.userId = req.query.userId;

  const limit = Math.min(parseInt(req.query.limit || '300', 10) || 300, 1000);
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.json({ logs });
});

// Daily summary: per day (IST), how many changes each user made, and how many
// of those marked an item "done" (accepted / cph / phase2 / dropped).
router.get('/daily', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  const rows = await AuditLog.aggregate([
    { $match: { handover: h._id } },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
          userId: '$userId',
          userName: '$userName',
        },
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $in: ['$newStatus', ['accepted', 'cph', 'phase2', 'dropped']] }, 1, 0] },
        },
      },
    },
    { $sort: { '_id.day': -1, total: -1 } },
  ]);

  const byDay = new Map();
  for (const r of rows) {
    const day = r._id.day;
    if (!byDay.has(day)) byDay.set(day, { date: day, total: 0, completed: 0, users: [] });
    const d = byDay.get(day);
    d.total += r.total;
    d.completed += r.completed;
    d.users.push({
      userId: r._id.userId,
      userName: r._id.userName || 'Unknown',
      total: r.total,
      completed: r.completed,
    });
  }

  res.json({ days: [...byDay.values()] });
});

export default router;
