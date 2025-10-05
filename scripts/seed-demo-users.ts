import mongoose from 'mongoose';
import { AdminUser } from '../lib/models';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pmjay';

async function seedDemoUsers() {
  await mongoose.connect(MONGODB_URI);

  const users = [
    {
      name: 'Super Admin',
      email: 'super.admin@pmjay.gov.in',
      password: await bcrypt.hash('Super@123', 10),
      role: 'Super Admin',
      permissions: ['read', 'write', 'delete', 'approve_funds', 'manage_users'],
      stateAccess: [],
      agencyAccess: [],
    },
    {
      name: 'Central Admin',
      email: 'central.admin@pmjay.gov.in',
      password: await bcrypt.hash('Central@123', 10),
      role: 'Agency Admin',
      permissions: ['read', 'write', 'approve_funds'],
      stateAccess: [],
      agencyAccess: [],
    },
    {
      name: 'State Admin',
      email: 'state.admin@pmjay.gov.in',
      password: await bcrypt.hash('State@123', 10),
      role: 'State Admin',
      permissions: ['read', 'write', 'approve_funds'],
      stateAccess: ['MH'], // Example: Maharashtra
      agencyAccess: [],
    },
    {
      name: 'Local Admin',
      email: 'local.admin@pmjay.gov.in',
      password: await bcrypt.hash('Local@123', 10),
      role: 'Agency Admin',
      permissions: ['read', 'write'],
      stateAccess: ['MH'],
      agencyAccess: [],
    },
    {
      name: 'Viewer',
      email: 'viewer@pmjay.gov.in',
      password: await bcrypt.hash('Viewer@123', 10),
      role: 'Viewer',
      permissions: ['read'],
      stateAccess: [],
      agencyAccess: [],
    },
  ];

  for (const user of users) {
    const exists = await AdminUser.findOne({ email: user.email });
    if (!exists) {
      await AdminUser.create(user);
      console.log(`Seeded user: ${user.email}`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seedDemoUsers().catch(err => {
  console.error('Error seeding users:', err);
  process.exit(1);
});
