import { Router } from 'express';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  return res.json({ token, user: user.toSafeJSON() });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

export default router;
