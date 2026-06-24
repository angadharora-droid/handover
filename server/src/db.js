import mongoose from 'mongoose';
import { config } from './config/env.js';

export async function connectDB() {
  if (!config.mongoUri) {
    throw new Error(
      'MONGODB_URI is not set. Copy server/.env.example to server/.env and paste your Atlas connection string.'
    );
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri);
  console.log('✓ MongoDB connected');
}
