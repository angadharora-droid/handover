import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { authRequired } from '../middleware/auth.js';
import { phoneKey } from '../utils/phone.js';
import { passwordPolicyError } from '../utils/passwordPolicy.js';
import { verifySsoToken } from '../utils/ssoClient.js';
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

// Central sign-on: the browser brings a hand-off token from the portal's auth
// service, which tells us which local user (Mongo _id) it belongs to. Issues
// the same JWT and user JSON as /login. Always fails unless AUTH_SERVICE_URL is set.
router.post('/sso', async (req, res) => {
  // Same per-IP throttle as /login, so bad tokens cannot be sprayed either.
  const throttleKey = `sso:${req.ip}`;
  if (loginBlocked(req.ip, throttleKey)) {
    return res.status(429).json({ error: 'Too many failed attempts. Please try again later.' });
  }

  const verified = await verifySsoToken(String(req.body?.token || ''));
  if (!verified) {
    recordLoginFailure(req.ip, throttleKey);
    return res.status(401).json({ error: 'SSO sign-in failed' });
  }

  const user = mongoose.isValidObjectId(verified.localUserId)
    ? await User.findById(verified.localUserId)
    : null;
  if (!user || !user.active) return res.status(404).json({ error: 'No account linked' });

  clearLoginFailures(throttleKey);
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
