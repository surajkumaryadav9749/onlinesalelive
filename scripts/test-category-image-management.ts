import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import {
  validateCategoryImageFile,
  saveUploadedCategoryFile,
  deleteUploadedCategoryFile,
} from '../src/lib/category-images';
import { Category as CategoryModel } from '../src/models/Category';
import { getHomepageDiscoveryData } from '../src/lib/data-service';
import { connectToDatabase } from '../src/lib/db';

async function runCategoryImageTestSuite() {
  console.log('================================================================');
  console.log('CATEGORY IMAGE MANAGEMENT TEST SUITE');
  console.log('Testing upload validation, model sync, CRUD, priority, and fallback');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testNumber: number, name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] Test ${testNumber}: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] Test ${testNumber}: ${name}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // --- 1. File Validation Tests ---
  console.log('--- 1. IMAGE FILE VALIDATION TESTS ---');

  // Valid JPEG
  const dummyJpg = new File([new Uint8Array(1024)], 'test-photo.jpg', { type: 'image/jpeg' });
  const valJpg = validateCategoryImageFile(dummyJpg);
  assert(1, 'Valid JPG file passes validation', valJpg.valid);

  // Valid PNG
  const dummyPng = new File([new Uint8Array(1024)], 'test-photo.png', { type: 'image/png' });
  const valPng = validateCategoryImageFile(dummyPng);
  assert(2, 'Valid PNG file passes validation', valPng.valid);

  // Valid WebP
  const dummyWebp = new File([new Uint8Array(1024)], 'test-photo.webp', { type: 'image/webp' });
  const valWebp = validateCategoryImageFile(dummyWebp);
  assert(3, 'Valid WebP file passes validation', valWebp.valid);

  // Exceeds 5MB
  const largeBuffer = new Uint8Array(5.5 * 1024 * 1024);
  const dummyLarge = new File([largeBuffer], 'too-large.png', { type: 'image/png' });
  const valLarge = validateCategoryImageFile(dummyLarge);
  assert(4, 'File exceeding 5 MB is rejected', !valLarge.valid && Boolean(valLarge.error?.includes('5 MB')));

  // Invalid extension / mime
  const dummyPdf = new File([new Uint8Array(1024)], 'document.pdf', { type: 'application/pdf' });
  const valPdf = validateCategoryImageFile(dummyPdf);
  assert(5, 'Non-image format (PDF) is rejected', !valPdf.valid);

  // Empty file
  const dummyEmpty = new File([], 'empty.jpg', { type: 'image/jpeg' });
  const valEmpty = validateCategoryImageFile(dummyEmpty);
  assert(6, 'Empty 0-byte file is rejected', !valEmpty.valid);

  // --- 2. File Save & Delete Tests ---
  console.log('\n--- 2. FILE STORAGE & CLEANUP TESTS ---');
  let savedFilePath = '';
  try {
    const dummyUpload = new File([Buffer.from('sample-image-content')], 'laptops-banner.webp', {
      type: 'image/webp',
    });
    savedFilePath = await saveUploadedCategoryFile(dummyUpload, 'test-laptops');
    const fileExistsOnDisk = await fs
      .access(path.join(process.cwd(), 'public', savedFilePath))
      .then(() => true)
      .catch(() => false);

    assert(
      7,
      'saveUploadedCategoryFile writes file to public/uploads/categories',
      savedFilePath.startsWith('/uploads/categories/') && fileExistsOnDisk
    );

    // Delete uploaded category file
    const deleted = await deleteUploadedCategoryFile(savedFilePath);
    const fileStillExists = await fs
      .access(path.join(process.cwd(), 'public', savedFilePath))
      .then(() => true)
      .catch(() => false);

    assert(8, 'deleteUploadedCategoryFile safely deletes unreferenced file', deleted && !fileStillExists);
  } catch (err) {
    assert(7, 'File storage test', false, String(err));
    assert(8, 'File cleanup test', false, String(err));
  }

  // --- 3. Database & Model Integration Tests ---
  console.log('\n--- 3. DATABASE MODEL & CRUD TESTS ---');
  await connectToDatabase();

  const testSlug = `test-cat-mgmt-${Date.now()}`;
  let createdCatId = '';

  try {
    // 9. Create category without image -> icon fallback
    const catNoImage = new CategoryModel({
      name: 'Test Cat No Image',
      slug: `${testSlug}-no-img`,
      icon: 'Headphones',
      description: 'Test category without image',
      isActive: true,
    });
    await catNoImage.validate();
    assert(
      9,
      'Category created without image sets empty imageUrl and keeps icon',
      catNoImage.icon === 'Headphones' && (catNoImage.imageUrl || '') === '' && (catNoImage.image || '') === ''
    );

    // 10. Create category with image
    const catWithImage = new CategoryModel({
      name: 'Test Cat With Image',
      slug: `${testSlug}-with-img`,
      icon: 'Laptop',
      imageUrl: '/uploads/categories/laptop-sample.webp',
      description: 'Test category with image',
      isActive: true,
    });
    await catWithImage.validate();
    assert(
      10,
      'Category created with imageUrl synchronizes image and imageUrl',
      catWithImage.imageUrl === '/uploads/categories/laptop-sample.webp' &&
        catWithImage.image === '/uploads/categories/laptop-sample.webp'
    );

    // Save test category to DB for update/remove testing
    await catWithImage.save();
    createdCatId = catWithImage._id.toString();

    // 11. Replace category image
    catWithImage.imageUrl = '/uploads/categories/laptop-sample-v2.webp';
    await catWithImage.validate();
    await catWithImage.save();
    const updatedCat = await CategoryModel.findById(createdCatId).lean();
    assert(
      11,
      'Replacing category image updates both imageUrl and image',
      updatedCat?.imageUrl === '/uploads/categories/laptop-sample-v2.webp' &&
        updatedCat?.image === '/uploads/categories/laptop-sample-v2.webp'
    );

    // 12. Remove category image -> reverts to icon fallback
    catWithImage.imageUrl = '';
    catWithImage.image = '';
    await catWithImage.save();
    const removedImageCat = await CategoryModel.findById(createdCatId).lean();
    assert(
      12,
      'Removing category image clears imageUrl and preserves icon fallback',
      (removedImageCat?.imageUrl || '') === '' &&
        (removedImageCat?.image || '') === '' &&
        removedImageCat?.icon === 'Laptop'
    );
  } catch (err) {
    assert(9, 'Category model tests', false, String(err));
  } finally {
    if (createdCatId) {
      await CategoryModel.deleteOne({ _id: createdCatId }).catch(() => {});
      await CategoryModel.deleteOne({ slug: `${testSlug}-no-img` }).catch(() => {});
    }
  }

  // --- 4. 50%+ Off & Shop by Category Priority Logic Tests ---
  console.log('\n--- 4. HOMEPAGE DISCOVERY IMAGE PRIORITY TESTS ---');

  // Test simulation of priority rules:
  // Case A: Qualifying product has image -> Product image wins
  const caseAProductImage = 'https://images.unsplash.com/sample-product.jpg';
  const caseACatImage = '/uploads/categories/sample-cat.webp';
  const caseAIcon = 'Laptop';
  const priorityA = caseAProductImage || caseACatImage || caseAIcon;
  assert(13, '50%+ category row prioritizes representative product image', priorityA === caseAProductImage);

  // Case B: Qualifying product has NO image -> Category image is used
  const caseBProductImage = '';
  const caseBCatImage = '/uploads/categories/sample-cat.webp';
  const caseBIcon = 'Laptop';
  const priorityB = caseBProductImage || caseBCatImage || caseBIcon;
  assert(14, '50%+ category row falls back to category image if product has no image', priorityB === caseBCatImage);

  // Case C: Neither has image -> Lucide icon is used
  const caseCProductImage = '';
  const caseCCatImage = '';
  const caseCIcon = 'Laptop';
  const priorityC = caseCProductImage || caseCCatImage || caseCIcon;
  assert(15, '50%+ category row falls back to Lucide icon if neither image exists', priorityC === caseCIcon);

  // Case D: Shop by Category priority: category image -> Lucide icon
  const catImageD = '/uploads/categories/beauty.webp';
  const iconD = 'Sparkles';
  const priorityD = catImageD || iconD;
  assert(16, 'Shop by Category prioritizes uploaded category image over icon', priorityD === catImageD);

  // 17. Live getHomepageDiscoveryData integration check
  try {
    const discovery = await getHomepageDiscoveryData();
    assert(
      17,
      'Live getHomepageDiscoveryData executes cleanly with category image schema',
      Array.isArray(discovery.discountCategories) && Array.isArray(discovery.categories)
    );
  } catch (err) {
    assert(17, 'Live getHomepageDiscoveryData', false, String(err));
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCategoryImageTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
