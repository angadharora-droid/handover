import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { config } from './config/env.js';
import { Handover } from './models/Handover.js';
import { User } from './models/User.js';

async function ensureUser({ name, email, password, role, designation }) {
  const lower = email.toLowerCase();
  let user = await User.findOne({ email: lower });
  if (user) {
    console.log(`• User already exists: ${lower} (${user.role})`);
    return user;
  }
  user = new User({ name, email: lower, role, designation: designation || '' });
  await user.setPassword(password);
  await user.save();
  console.log(`✓ Created ${role}: ${lower}  (password: ${password})`);
  return user;
}

async function seed() {
  await connectDB();

  // The single property managed by this build.
  let handover = await Handover.findOne();
  if (!handover) {
    handover = await Handover.create({
      name: 'Centre Point Amravati',
      code: 'CPH-AMR',
      location: 'Amravati',
      giver: 'Hariganga',
      receiver: 'Centre Point Hospitality',
    });
    console.log('✓ Created handover:', handover.name);
  } else {
    console.log('• Handover already exists:', handover.name);
  }

  // Administrator account.
  await ensureUser({
    name: config.seedAdmin.name,
    email: config.seedAdmin.email,
    password: config.seedAdmin.password,
    role: 'admin',
    designation: 'System Administrator',
  });

  // Optional demo accounts so you can test both roles immediately.
  if (config.seedDemoUsers) {
    await ensureUser({
      name: 'Hariganga Rep',
      email: 'hariganga@hariganga.local',
      password: 'Hariganga123!',
      role: 'hariganga',
      designation: 'Project Manager',
    });
    await ensureUser({
      name: 'CPH Rep',
      email: 'cph@hariganga.local',
      password: 'Cph123!',
      role: 'cph',
      designation: 'Operations Manager',
    });
  }

  await mongoose.disconnect();
  console.log('\n✓ Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
