import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { connectToDatabase } from '../src/lib/db';
import { HeroBanner } from '../src/models/HeroBanner';
import fs from 'fs';
import path from 'path';

async function fixLocalBanners() {
  await connectToDatabase();
  const diskFiles = fs.readdirSync(path.join(process.cwd(), 'public', 'uploads', 'banners'));
  console.log('Disk banner files:', diskFiles);

  const banners = await HeroBanner.find({}).lean();
  console.log('Current DB banners count:', banners.length);
  for (const b of banners) {
    console.log('Banner:', b._id, b.title, 'imageUrl:', b.imageUrl, 'mobileImageUrl:', b.mobileImageUrl, 'isActive:', b.isActive);
  }

  if (diskFiles.length > 0) {
    const validUrl = `/uploads/banners/${diskFiles[0]}`;
    await HeroBanner.updateMany({}, {
      $set: {
        imageUrl: validUrl,
        mobileImageUrl: validUrl,
        isActive: true,
      }
    });
    console.log('Updated DB banners to point to valid disk image:', validUrl);
  }
}

fixLocalBanners().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
