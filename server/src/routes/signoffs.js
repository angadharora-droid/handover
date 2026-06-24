import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { AreaSignoff } from '../models/AreaSignoff.js';
import { FinalSignoff } from '../models/FinalSignoff.js';
import { getCurrentHandover } from '../utils/handover.js';
import { CHECKLIST } from '../data/checklist.js';

const router = Router();
router.use(authRequired);

// ---- Area sign-offs -------------------------------------------------------

router.get('/areas', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });
  const signoffs = await AreaSignoff.find({ handover: h._id });
  res.json({ signoffs });
});

// Sign one side (hariganga | cph) of an area. Role rules: a Hariganga user
// can only sign the Hariganga side, a CPH user only the CPH side; an admin
// can sign either.
router.put('/areas/:area', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  const area = req.params.area;
  if (!CHECKLIST[area]) return res.status(400).json({ error: 'Unknown area' });

  const { side, name } = req.body || {};
  if (!['hariganga', 'cph'].includes(side)) {
    return res.status(400).json({ error: 'side must be "hariganga" or "cph"' });
  }
  if (req.user.role !== 'admin' && req.user.role !== side) {
    return res.status(403).json({ error: `Your role can only sign the "${req.user.role}" side` });
  }

  const update = {
    [side]: { name: name || req.user.name, userId: req.user._id, signedAt: new Date() },
  };
  const signoff = await AreaSignoff.findOneAndUpdate(
    { handover: h._id, area },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ signoff });
});

// ---- Final sign-off -------------------------------------------------------

router.get('/final', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });
  const finalSignoff = await FinalSignoff.findOne({ handover: h._id });
  res.json({ finalSignoff, finalised: h.finalised });
});

router.post('/final', async (req, res) => {
  const h = await getCurrentHandover();
  if (!h) return res.status(400).json({ error: 'No handover found. Run the seed script.' });

  const { hariganga, cph } = req.body || {};
  if (!hariganga?.name || !cph?.name) {
    return res.status(400).json({ error: 'Both signatory names are required' });
  }

  const finalSignoff = await FinalSignoff.findOneAndUpdate(
    { handover: h._id },
    {
      $set: {
        hariganga: { name: hariganga.name, designation: hariganga.designation || '' },
        cph: { name: cph.name, designation: cph.designation || '' },
        finalisedAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  h.finalised = true;
  await h.save();

  res.json({ finalSignoff, finalised: true });
});

export default router;
