import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { getCurrentHandover } from '../utils/handover.js';

const router = Router();

router.get('/', authRequired, async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run `npm run seed` in the server folder.' });
  res.json({
    handover: {
      id: h._id,
      name: h.name,
      code: h.code,
      location: h.location,
      giver: h.giver,
      receiver: h.receiver,
      finalised: h.finalised,
    },
  });
});

export default router;
