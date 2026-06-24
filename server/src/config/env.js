import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  seedDemoUsers: (process.env.SEED_DEMO_USERS || 'true').toLowerCase() !== 'false',
  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || 'Administrator',
    email: (process.env.SEED_ADMIN_EMAIL || 'admin@hariganga.local').toLowerCase(),
    password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
  },
};
