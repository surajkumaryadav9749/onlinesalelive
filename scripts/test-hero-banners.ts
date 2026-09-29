import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { connectToDatabase } from '../src/lib/db';
import { HeroBanner } from '../src/models/HeroBanner';
import {
  MAX_ACTIVE_HERO_BANNERS,
  MAX_BANNER_FILE_SIZE,
  validateBannerImageFile,
  enforceMaxActiveBanners,
} from '../src/lib/hero-banners';
import { getActiveHeroBanners } from '../src/lib/data-service';

async function runTestSuite() {
  console.log('====================================================');
  console.log('HERO BACKGROUND BANNER CAROUSEL TEST SUITE');
  console.log('Validating Max 5 Active Banners, Auto-Deactivation,');
  console.log('File Validation, Zero-Banner Fallback, and Data Query');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  await connectToDatabase();

  const TEST_PREFIX = 'test-hero-carousel-';

  // Cleanup any leftover test banners
  await HeroBanner.deleteMany({ title: new RegExp(`^${TEST_PREFIX}`) });

  console.log('--- 1. IMAGE FILE VALIDATION TESTS ---');
  {
    // Valid image mock files
    const validJpg = new File([new Uint8Array(100)], 'banner1.jpg', { type: 'image/jpeg' });
    const validPng = new File([new Uint8Array(100)], 'banner2.png', { type: 'image/png' });
    const validWebp = new File([new Uint8Array(100)], 'banner3.webp', { type: 'image/webp' });
    const validJpeg = new File([new Uint8Array(100)], 'banner4.jpeg', { type: 'image/jpeg' });

    assert('Valid JPG file accepted', validateBannerImageFile(validJpg).valid);
    assert('Valid PNG file accepted', validateBannerImageFile(validPng).valid);
    assert('Valid WebP file accepted', validateBannerImageFile(validWebp).valid);
    assert('Valid JPEG file accepted', validateBannerImageFile(validJpeg).valid);

    // Invalid mock files
    const invalidPdf = new File([new Uint8Array(100)], 'doc.pdf', { type: 'application/pdf' });
    const invalidGif = new File([new Uint8Array(100)], 'anim.gif', { type: 'image/gif' });
    const invalidTxt = new File([new Uint8Array(100)], 'notes.txt', { type: 'text/plain' });
    const emptyFile = new File([new Uint8Array(0)], 'empty.jpg', { type: 'image/jpeg' });
    const oversizedFile = new File([new Uint8Array(6 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });

    assert('PDF file rejected', !validateBannerImageFile(invalidPdf).valid);
    assert('GIF file rejected', !validateBannerImageFile(invalidGif).valid);
    assert('TXT file rejected', !validateBannerImageFile(invalidTxt).valid);
    assert('Empty file rejected', !validateBannerImageFile(emptyFile).valid);
    assert('File > 5 MB rejected', !validateBannerImageFile(oversizedFile).valid);
    assert('MAX_BANNER_FILE_SIZE is 5 MB', MAX_BANNER_FILE_SIZE === 5 * 1024 * 1024);
  }

  console.log('\n--- 2. MAXIMUM 5 ACTIVE BANNERS ENFORCEMENT & AUTO-DEACTIVATION ---');
  {
    assert('MAX_ACTIVE_HERO_BANNERS is 5', MAX_ACTIVE_HERO_BANNERS === 5);

    // Insert 5 active banners sequentially with slight timestamp offsets
    const bannerIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const banner = await HeroBanner.create({
        title: `${TEST_PREFIX}Banner ${i}`,
        imageUrl: `/uploads/banners/test-${i}.webp`,
        linkUrl: `/deals?banner=${i}`,
        isActive: true,
        displayOrder: i,
        createdAt: new Date(Date.now() - (6 - i) * 60000), // Banner 1 is oldest, Banner 5 is newest
      });
      bannerIds.push(banner._id.toString());
    }

    const initialActive = await HeroBanner.find({
      title: new RegExp(`^${TEST_PREFIX}`),
      isActive: true,
    }).sort({ createdAt: 1 });

    assert('5 active banners successfully seeded', initialActive.length === 5);
    assert('Banner 1 is the oldest active banner', initialActive[0].title === `${TEST_PREFIX}Banner 1`);

    // Now simulate uploading Banner 6 (a new active banner)
    // When Banner 6 is added, enforceMaxActiveBanners(1) must deactivate Banner 1
    const { deactivatedCount, deactivatedIds } = await enforceMaxActiveBanners(1);

    assert('enforceMaxActiveBanners deactivates exactly 1 oldest banner', deactivatedCount === 1);
    assert('The deactivated banner is Banner 1 (oldest)', deactivatedIds.includes(bannerIds[0]));

    // Check that Banner 1 is now inactive in DB
    const banner1After = await HeroBanner.findById(bannerIds[0]);
    assert('Banner 1 isActive is false', banner1After?.isActive === false);
    assert('Banner 1 record is preserved in DB (not permanently deleted)', banner1After !== null);

    // Create Banner 6
    const banner6 = await HeroBanner.create({
      title: `${TEST_PREFIX}Banner 6`,
      imageUrl: '/uploads/banners/test-6.webp',
      linkUrl: '/deals?banner=6',
      isActive: true,
      displayOrder: 6,
      createdAt: new Date(),
    });
    bannerIds.push(banner6._id.toString());

    // Verify active count is strictly 5
    const activeAfter6 = await HeroBanner.find({
      title: new RegExp(`^${TEST_PREFIX}`),
      isActive: true,
    }).sort({ createdAt: 1 });

    assert('Active banners count is exactly 5 after adding Banner 6', activeAfter6.length === 5);
    assert('Active banners are Banner 2, 3, 4, 5, 6', 
      activeAfter6.map(b => b.title).join(',') === 
      [`${TEST_PREFIX}Banner 2`, `${TEST_PREFIX}Banner 3`, `${TEST_PREFIX}Banner 4`, `${TEST_PREFIX}Banner 5`, `${TEST_PREFIX}Banner 6`].join(',')
    );

    // Now add Banner 7: Banner 2 should be automatically deactivated
    const deact7 = await enforceMaxActiveBanners(1);
    assert('Adding Banner 7 triggers deactivation of Banner 2', deact7.deactivatedIds.includes(bannerIds[1]));

    const banner7 = await HeroBanner.create({
      title: `${TEST_PREFIX}Banner 7`,
      imageUrl: '/uploads/banners/test-7.webp',
      linkUrl: '/deals?banner=7',
      isActive: true,
      displayOrder: 7,
      createdAt: new Date(),
    });
    bannerIds.push(banner7._id.toString());

    const activeAfter7 = await HeroBanner.find({
      title: new RegExp(`^${TEST_PREFIX}`),
      isActive: true,
    }).sort({ createdAt: 1 });

    assert('Active count is still exactly 5 after Banner 7', activeAfter7.length === 5);
    assert('Active banners are Banner 3, 4, 5, 6, 7', 
      activeAfter7.map(b => b.title).join(',') === 
      [`${TEST_PREFIX}Banner 3`, `${TEST_PREFIX}Banner 4`, `${TEST_PREFIX}Banner 5`, `${TEST_PREFIX}Banner 6`, `${TEST_PREFIX}Banner 7`].join(',')
    );

    // Test activating an inactive banner:
    // If admin enables Banner 1 again, Banner 3 (currently oldest active) must be deactivated
    const reActivation = await enforceMaxActiveBanners(1, bannerIds[0]);
    assert('Re-activating Banner 1 deactivates oldest active banner (Banner 3)', reActivation.deactivatedIds.includes(bannerIds[2]));

    await HeroBanner.findByIdAndUpdate(bannerIds[0], { $set: { isActive: true } });

    const activeAfterReactivate = await HeroBanner.find({
      title: new RegExp(`^${TEST_PREFIX}`),
      isActive: true,
    });
    assert('Active count remains strictly 5 after manual reactivation', activeAfterReactivate.length === 5);
  }

  console.log('\n--- 3. DATA SERVICE PUBLIC QUERY & FALLBACKS ---');
  {
    const publicBanners = await getActiveHeroBanners(5);
    assert('getActiveHeroBanners returns an array', Array.isArray(publicBanners));
    assert('getActiveHeroBanners returns at most 5 banners', publicBanners.length <= 5);
    assert('All returned banners have isActive: true', publicBanners.every(b => b.isActive));

    // Zero-banner fallback test
    await HeroBanner.updateMany(
      { title: new RegExp(`^${TEST_PREFIX}`) },
      { $set: { isActive: false } }
    );

    const testActiveCount = await HeroBanner.countDocuments({
      title: new RegExp(`^${TEST_PREFIX}`),
      isActive: true,
    });
    assert('All test banners safely deactivated', testActiveCount === 0);
  }

  console.log('\n--- 4. BANNER CLICK DESTINATION URL HANDLING ---');
  {
    const bannerWithLink = await HeroBanner.create({
      title: `${TEST_PREFIX}Clickable Deal Banner`,
      imageUrl: '/uploads/banners/sale.webp',
      linkUrl: '/deals/festive-sale',
      isActive: true,
    });
    assert('Banner destination linkUrl is correctly stored', bannerWithLink.linkUrl === '/deals/festive-sale');

    const bannerNoLink = await HeroBanner.create({
      title: `${TEST_PREFIX}Visual Only Banner`,
      imageUrl: '/uploads/banners/bg.webp',
      linkUrl: '',
      isActive: true,
    });
    assert('Banner without link defaults to empty string', bannerNoLink.linkUrl === '');
  }

  // Final cleanup
  await HeroBanner.deleteMany({ title: new RegExp(`^${TEST_PREFIX}`) });
  console.log('\nCleaned up all temporary test banner records.');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (${passed + failed} TOTAL)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
