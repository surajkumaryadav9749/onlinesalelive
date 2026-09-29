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
  saveUploadedBannerFile,
  deleteUploadedBannerFile,
  enforceMaxActiveBanners,
} from '../src/lib/hero-banners';
import { isBlobUrl, isBlobStorageConfigured } from '../src/lib/storage';
import { getActiveHeroBanners } from '../src/lib/data-service';
import { signAdminToken, verifyAdminToken } from '../src/lib/auth';
import { checkAdminAuth } from '../src/lib/api-helpers';

async function runTestSuite() {
  console.log('================================================================');
  console.log('HERO BANNER & PERSISTENT STORAGE PRODUCTION TEST SUITE');
  console.log('Validating Persistent Storage, Max 5 Active Rule, Auto-Deactivation,');
  console.log('File Validation, Safe Deletion, and Homepage Integration');
  console.log('================================================================\n');

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

  console.log('--- 0. AUTHENTICATION & ACCESS CONTROL TESTS ---');
  {
    // Test checkAdminAuth without cookie
    const unauthCheck = await checkAdminAuth();
    assert('Unauthenticated request is rejected with 401', Boolean(unauthCheck.errorResponse && unauthCheck.errorResponse.status === 401));

    // Test signAdminToken and verifyAdminToken
    const testAdminPayload = {
      id: 'admin_test_123',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin' as const,
    };
    const validToken = await signAdminToken(testAdminPayload);
    const verifiedPayload = await verifyAdminToken(validToken);
    assert('Valid admin token is successfully signed and verified', Boolean(verifiedPayload && verifiedPayload.email === 'admin@test.com'));

    // Test invalid / forged token rejected
    const forgedToken = validToken + 'tampered';
    const forgedResult = await verifyAdminToken(forgedToken);
    assert('Forged / tampered admin token is rejected', forgedResult === null);
  }

  console.log('\n--- 1. IMAGE FILE VALIDATION & SECURITY TESTS ---');
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

  console.log('\n--- 2. PERSISTENT STORAGE UPLOAD & SAFETY TESTS ---');
  let savedBannerUrl = '';
  {
    const isBlobConfig = isBlobStorageConfigured();
    console.log(`  [Storage Environment] Vercel Blob configured: ${isBlobConfig}`);

    assert('isBlobUrl identifies Vercel Blob CDN URLs correctly',
      isBlobUrl('https://xyz.public.blob.vercel-storage.com/banners/hero-test-123.webp') &&
      !isBlobUrl('/uploads/banners/hero-test-123.webp')
    );

    // Upload mock banner file
    const sampleBannerFile = new File([Buffer.from('hero-banner-image-payload-data')], 'summer-sale.webp', {
      type: 'image/webp',
    });

    try {
      savedBannerUrl = await saveUploadedBannerFile(sampleBannerFile);
      assert('saveUploadedBannerFile executes successfully without filesystem errors', Boolean(savedBannerUrl));
      assert('saveUploadedBannerFile returns persistent storage URL (Blob or DB-backed route)',
        savedBannerUrl.startsWith('https://') || savedBannerUrl.startsWith('/uploads/banners/')
      );
    } catch (err) {
      assert('saveUploadedBannerFile executes successfully', false, String(err));
    }
  }

  console.log('\n--- 3. DATABASE BANNER CREATION & PERSISTENT URL STORAGE ---');
  let createdBannerId = '';
  {
    try {
      const banner = await HeroBanner.create({
        title: `${TEST_PREFIX}Production Upload Test`,
        imageUrl: savedBannerUrl,
        linkUrl: '/deals/mega-sale',
        isActive: true,
        displayOrder: 1,
      });

      createdBannerId = banner._id.toString();
      assert('Banner record successfully created in MongoDB', Boolean(banner._id));
      assert('Banner record stores persistent imageUrl', banner.imageUrl === savedBannerUrl);
      assert('Banner isActive is true when specified', banner.isActive === true);
      assert('Banner destination linkUrl is stored', banner.linkUrl === '/deals/mega-sale');
    } catch (err) {
      assert('Banner database creation', false, String(err));
    }
  }

  console.log('\n--- 4. MAXIMUM 5 ACTIVE BANNERS ENFORCEMENT & AUTO-DEACTIVATION ---');
  {
    assert('MAX_ACTIVE_HERO_BANNERS is 5', MAX_ACTIVE_HERO_BANNERS === 5);

    // Clean up temporary banner created above
    if (createdBannerId) {
      await HeroBanner.deleteOne({ _id: createdBannerId });
    }

    // Insert 5 active banners sequentially with timestamp offsets
    const bannerIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const banner = await HeroBanner.create({
        title: `${TEST_PREFIX}Banner ${i}`,
        imageUrl: `https://mock.blob.vercel-storage.com/banners/test-${i}.webp`,
        linkUrl: `/deals?banner=${i}`,
        isActive: true,
        displayOrder: i,
        createdAt: new Date(Date.now() - (6 - i) * 60000), // Banner 1 oldest, Banner 5 newest
      });
      bannerIds.push(banner._id.toString());
    }

    const initialActive = await HeroBanner.find({
      title: new RegExp(`^${TEST_PREFIX}`),
      isActive: true,
    }).sort({ createdAt: 1 });

    assert('5 active banners successfully seeded', initialActive.length === 5);
    assert('Banner 1 is the oldest active banner', initialActive[0].title === `${TEST_PREFIX}Banner 1`);

    // Simulate uploading Banner 6 (new active banner)
    const { deactivatedCount, deactivatedIds } = await enforceMaxActiveBanners(1);

    assert('enforceMaxActiveBanners deactivates exactly 1 oldest banner', deactivatedCount === 1);
    assert('The deactivated banner is Banner 1 (oldest)', deactivatedIds.includes(bannerIds[0]));

    // Check that Banner 1 is inactive in DB, but preserved
    const banner1After = await HeroBanner.findById(bannerIds[0]);
    assert('Banner 1 isActive is false', banner1After?.isActive === false);
    assert('Banner 1 record is preserved in DB (not deleted)', banner1After !== null);

    // Create Banner 6
    const banner6 = await HeroBanner.create({
      title: `${TEST_PREFIX}Banner 6`,
      imageUrl: 'https://mock.blob.vercel-storage.com/banners/test-6.webp',
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

    // Add Banner 7: Banner 2 must be automatically deactivated
    const deact7 = await enforceMaxActiveBanners(1);
    assert('Adding Banner 7 triggers deactivation of Banner 2', deact7.deactivatedIds.includes(bannerIds[1]));

    const banner7 = await HeroBanner.create({
      title: `${TEST_PREFIX}Banner 7`,
      imageUrl: 'https://mock.blob.vercel-storage.com/banners/test-7.webp',
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

    // Test reactivating an inactive banner (Banner 1)
    const reActivation = await enforceMaxActiveBanners(1, bannerIds[0]);
    assert('Re-activating Banner 1 deactivates oldest active banner (Banner 3)', reActivation.deactivatedIds.includes(bannerIds[2]));

    await HeroBanner.findByIdAndUpdate(bannerIds[0], { $set: { isActive: true } });

    const activeAfterReactivate = await HeroBanner.find({
      title: new RegExp(`^${TEST_PREFIX}`),
      isActive: true,
    });
    assert('Active count remains strictly 5 after manual reactivation', activeAfterReactivate.length === 5);
  }

  console.log('\n--- 5. DEACTIVATION VS PERMANENT DELETION ---');
  {
    // Create a banner to test deactivation
    const testDeactBanner = await HeroBanner.create({
      title: `${TEST_PREFIX}Deactivation Test`,
      imageUrl: savedBannerUrl,
      isActive: true,
    });

    // Deactivation: isActive becomes false, record stays, image NOT deleted
    await HeroBanner.findByIdAndUpdate(testDeactBanner._id, { $set: { isActive: false } });
    const deactRecord = await HeroBanner.findById(testDeactBanner._id);
    assert('Deactivation updates isActive to false', deactRecord?.isActive === false);
    assert('Deactivation preserves database record', Boolean(deactRecord));

    // Permanent delete: calls deleteUploadedBannerFile safely
    const deleteResult = await deleteUploadedBannerFile(savedBannerUrl, testDeactBanner._id.toString());
    await HeroBanner.findByIdAndDelete(testDeactBanner._id);
    const postDeleteRecord = await HeroBanner.findById(testDeactBanner._id);
    assert('Permanent delete removes banner document from DB', postDeleteRecord === null);
    assert('deleteUploadedBannerFile executes cleanly', typeof deleteResult === 'boolean');
  }

  console.log('\n--- 6. EXTERNAL IMAGE URL & HOMEPAGE QUERY INTEGRATION ---');
  {
    // External image URL
    const externalBanner = await HeroBanner.create({
      title: `${TEST_PREFIX}External URL Banner`,
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1920',
      linkUrl: 'https://amazon.in/deal',
      isActive: true,
      displayOrder: 0,
    });

    assert('External Image URL banner created successfully', Boolean(externalBanner._id));
    assert('External URL preserved without modification', externalBanner.imageUrl.startsWith('https://images.unsplash.com'));

    // Test getActiveHeroBanners used by Homepage
    const activeBanners = await getActiveHeroBanners(5);
    assert('getActiveHeroBanners returns an array', Array.isArray(activeBanners));
    assert('getActiveHeroBanners returns at most 5 banners', activeBanners.length <= 5);
    assert('All returned banners have isActive: true', activeBanners.every(b => b.isActive));
    assert('Returned banners contain persistent imageUrls', activeBanners.some(b => b.imageUrl.startsWith('http')));
  }

  // Final cleanup
  await HeroBanner.deleteMany({ title: new RegExp(`^${TEST_PREFIX}`) });
  console.log('\nCleaned up all temporary test banner records.');

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (${passed + failed} TOTAL)`);
  console.log('================================================================');

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
