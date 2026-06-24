import { Router } from 'express';
import { User, ROLE_VALUES } from '../models/User.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { CHECKLIST } from '../data/checklist.js';

const router = Router();

// All user-management endpoints are admin-only.
router.use(authRequired, requireRole('admin'));

// Keep only valid, de-duplicated area names.
function sanitizeAreas(areas) {
  if (!Array.isArray(areas)) return [];
  return [...new Set(areas.filter((a) => typeof a === 'string' && CHECKLIST[a]))];
}

router.get('/', async (req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users: users.map((u) => u.toSafeJSON()) });
});

router.post('/', async (req, res) => {
  const { name, email, password, role, designation, assignedAreas } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (role && !ROLE_VALUES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLE_VALUES.join(', ')}` });
  }
  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) return res.status(409).json({ error: 'A user with that email already exists' });

  const user = new User({
    name,
    email,
    role: role || 'cph',
    designation: designation || '',
    assignedAreas: sanitizeAreas(assignedAreas),
  });
  await user.setPassword(password);
  await user.save();
  res.status(201).json({ user: user.toSafeJSON() });
});

router.patch('/:id', async (req, res) => {
  const { name, role, designation, active, password, assignedAreas } = req.body || {};
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name !== undefined) user.name = name;
  if (designation !== undefined) user.designation = designation;
  if (active !== undefined) user.active = !!active;
  if (assignedAreas !== undefined) user.assignedAreas = sanitizeAreas(assignedAreas);
  if (role !== undefined) {
    if (!ROLE_VALUES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${ROLE_VALUES.join(', ')}` });
    }
    user.role = role;
  }
  if (password) await user.setPassword(password);

  await user.save();
  res.json({ user: user.toSafeJSON() });
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
});

export default router;
