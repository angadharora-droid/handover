import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { config } from './config/env.js';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import checklistRoutes from './routes/checklist.js';
import entryRoutes from './routes/entries.js';
import signoffRoutes from './routes/signoffs.js';
import handoverRoutes from './routes/handover.js';
import assignmentRoutes from './routes/assignments.js';
import auditRoutes from './routes/audit.js';
import customItemRoutes from './routes/customItems.js';
import photoRoutes from './routes/photos.js';

const app = express();

const allowedOrigins = config.clientOrigin
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients (curl, server-to-server) with no Origin,
      // the explicitly configured origins, and — for dev convenience — any
      // localhost / 127.0.0.1 port (Vite may shift from 5173 to 5174, etc.).
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
// Raised from the 100kb default so item photos (compressed JPEG data URLs,
// uploaded one at a time) fit comfortably in a single request body.
app.use(express.json({ limit: '15mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/signoffs', signoffRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/custom-items', customItemRoutes);
app.use('/api/photos', photoRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

connectDB()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`✓ API listening on http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
