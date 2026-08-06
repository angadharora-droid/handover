import { Router } from 'express';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { authRequired } from '../middleware/auth.js';
import { phoneKey } from '../utils/phone.js';
import { passwordPolicyError } from '../utils/passwordPolicy.js';
import { loginBlocked, recordLoginFailure, clearLoginFailures } from '../utils/loginGuard.js';

const router = Router();

// The identifier is either an email (contains "@", matches any user) or a
// phone number (admins only — other roles must sign in with their email).
async function findByIdentifier(identifier) {
  if (identifier.includes('@')) {
    return User.findOne({ email: identifier.toLowerCase() });
  }
  const key = phoneKey(identifier);
  if (!key) return null;
  const admins = await User.find({ role: 'admin', phone: { $nin: [null, ''] } });
  return admins.find((u) => phoneKey(u.phone) === key) || null;
}

router.post('/login', async (req, res) => {
  const body = req.body || {};
  // Older clients still send { email }; treat it as the identifier.
  const identifier = String(body.identifier ?? body.email ?? '').trim();
  const password = body.password;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email or phone number and password are required' });
  }

  // Throttle key: normalised so "+91 98765-43210" and "9876543210" share a counter.
  const idKey = identifier.includes('@')
    ? identifier.toLowerCase()
    : phoneKey(identifier) || identifier;
  if (loginBlocked(req.ip, idKey)) {
    return res.status(429).json({ error: 'Too many failed attempts. Please try again later.' });
  }

  const user = await findByIdentifier(identifier);
  const ok = user && user.active ? await user.verifyPassword(password) : false;
  if (!ok) {
    recordLoginFailure(req.ip, idKey);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  clearLoginFailures(idKey);
  const token = signToken(user);
  return res.json({ token, user: user.toSafeJSON() });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

router.post('/change-password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  const ok = await req.user.verifyPassword(currentPassword);
  // 400, not 401 — the client treats a 401 as an expired session and logs out.
  if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

  const policyError = passwordPolicyError(req.user.role, newPassword);
  if (policyError) return res.status(400).json({ error: policyError });

  await req.user.setPassword(newPassword);
  await req.user.save();
  res.json({ ok: true });
});

export default router;
