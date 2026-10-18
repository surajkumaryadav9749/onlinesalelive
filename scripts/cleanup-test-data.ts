import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function cleanup() {
  if (!process.env.MONGODB_URI) {
    console.log('No MONGODB_URI found');
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const catRes = await mongoose.connection.collection('categories').deleteMany({
    slug: { $regex: /test/i },
  });
  console.log('Deleted test categories:', catRes.deletedCount);
  await mongoose.disconnect();
}

cleanup().catch(console.error);
