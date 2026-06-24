import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { CHECKLIST, STATUS_OPTIONS, STATUS_ORDER, IMMEDIATE_KEYWORDS } from '../data/checklist.js';

const router = Router();

// The structural template. Dynamic state is fetched separately from /entries.
router.get('/', authRequired, (req, res) => {
  res.json({
    checklist: CHECKLIST,
    statusOptions: STATUS_OPTIONS,
    statusOrder: STATUS_ORDER,
    immediateKeywords: IMMEDIATE_KEYWORDS,
  });
});

export default router;
