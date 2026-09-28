import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first, fallback to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  const name = process.env.ADMIN_NAME || 'Super Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@onlinesalelive.in').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error('Error: ADMIN_PASSWORD is not defined in environment variables.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);

  const AdminSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      passwordHash: { type: String, required: true },
      role: { type: String, default: 'admin' },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

  const AdminModel =
    mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const existing = await AdminModel.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
  } else {
    await AdminModel.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
    });
  }

  console.log(`Admin credentials synchronized successfully for ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Seed Admin Failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
