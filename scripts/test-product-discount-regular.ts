import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { matchesDiscountRange, PRODUCT_DISCOUNT_OPTIONS, filterAndSortProducts } from '../src/lib/filter-utils';
import { VALID_DEAL_TYPES } from '../src/lib/csv-import';
import { Product as ProductModel } from '../src/models/Product';
import { Deal as DealModel } from '../src/models/Deal';
import { Product as ProductType, DealType } from '../src/types';

async function runTestSuite() {
  console.log('====================================================');
  console.log('PRODUCT DISCOUNT & REGULAR DEAL TYPE TEST SUITE');
  console.log('Testing Discount Buckets, Regular Deal Type, Filters & Edge Cases');
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

  console.log('--- 1. DISCOUNT BUCKET RANGE & ZERO OVERLAP TESTS ---');
  // Required test cases from prompt:
  const bucketTestCases = [
    { discount: 10, expectedBucket: 10 },
    { discount: 15, expectedBucket: 10 },
    { discount: 19, expectedBucket: 10 },
    { discount: 20, expectedBucket: 20 },
    { discount: 25, expectedBucket: 20 },
    { discount: 29, expectedBucket: 20 },
    { discount: 30, expectedBucket: 30 },
    { discount: 39, expectedBucket: 30 },
    { discount: 40, expectedBucket: 40 },
    { discount: 49, expectedBucket: 40 },
    { discount: 50, expectedBucket: 50 },
    { discount: 59, expectedBucket: 50 },
    { discount: 60, expectedBucket: 60 },
    { discount: 69, expectedBucket: 60 },
    { discount: 70, expectedBucket: 70 },
    { discount: 79, expectedBucket: 70 },
    { discount: 80, expectedBucket: 80 },
    { discount: 89, expectedBucket: 80 },
    { discount: 90, expectedBucket: 90 },
    { discount: 95, expectedBucket: 90 },
  ];

  for (const { discount, expectedBucket } of bucketTestCases) {
    const matchesExpected = matchesDiscountRange(discount, expectedBucket);
    assert(`${discount}% -> ${expectedBucket}% OFF bucket`, matchesExpected);

    // Verify zero overlap across all other buckets
    const otherBuckets = PRODUCT_DISCOUNT_OPTIONS.map((o) => o.value).filter((v) => v !== expectedBucket);
    let matchedOthers = false;
    for (const other of otherBuckets) {
      if (matchesDiscountRange(discount, other)) {
        matchedOthers = true;
        break;
      }
    }
    assert(`${discount}% matches ONLY ${expectedBucket}% OFF with NO overlap`, !matchedOthers);
  }

  console.log('\n--- 2. EDGE CASES & SAFE DISCOUNT HANDLING ---');
  {
    assert('0% discount matches NO discount bucket', PRODUCT_DISCOUNT_OPTIONS.every((opt) => !matchesDiscountRange(0, opt.value)));
    assert('null discount matches NO discount bucket', PRODUCT_DISCOUNT_OPTIONS.every((opt) => !matchesDiscountRange(null, opt.value)));
    assert('undefined discount matches NO discount bucket', PRODUCT_DISCOUNT_OPTIONS.every((opt) => !matchesDiscountRange(undefined, opt.value)));
    assert('negative discount matches NO discount bucket', PRODUCT_DISCOUNT_OPTIONS.every((opt) => !matchesDiscountRange(-10, opt.value)));
    assert('105% discount (> 100) matches NO discount bucket', PRODUCT_DISCOUNT_OPTIONS.every((opt) => !matchesDiscountRange(105, opt.value)));
    assert('NaN discount matches NO discount bucket', PRODUCT_DISCOUNT_OPTIONS.every((opt) => !matchesDiscountRange(NaN, opt.value)));
    assert('9.9% discount does not prematurely enter 10% OFF', !matchesDiscountRange(9.9, 10));
    assert('19.99% discount is strictly in 10% OFF, NOT in 20% OFF', matchesDiscountRange(19.99, 10) && !matchesDiscountRange(19.99, 20));
  }

  console.log('\n--- 3. REGULAR DEAL TYPE VALIDATION ---');
  {
    assert('"Regular" is present in VALID_DEAL_TYPES for CSV import', VALID_DEAL_TYPES.includes('Regular'));
    
    // Check Product Mongoose Schema
    const productDealTypeEnum = (ProductModel.schema.path('dealType') as unknown as { enumValues: string[] }).enumValues;
    assert('Product model schema enum includes "Regular"', productDealTypeEnum.includes('Regular'));
    assert('Product model schema enum preserves existing types', 
      ['Sale', "Today's Deal", 'Flash Deal', 'Price Drop', 'Major Discount', 'Featured Deal'].every(t => productDealTypeEnum.includes(t))
    );

    // Check Deal Mongoose Schema
    const dealDealTypeEnum = (DealModel.schema.path('dealType') as unknown as { enumValues: string[] }).enumValues;
    assert('Deal model schema enum includes "Regular"', dealDealTypeEnum.includes('Regular'));
  }

  console.log('\n--- 4. FRONTEND FILTER & SORT INTEGRATION ---');
  {
    const sampleProducts: ProductType[] = [
      {
        id: 'p1',
        name: 'Samsung Galaxy Phone',
        slug: 'samsung-galaxy-phone',
        description: 'Test Samsung Phone',
        image: '/test.jpg',
        price: 900,
        originalPrice: 1000,
        discountPercent: 10,
        dealType: 'Sale',
        category: 'Mobiles',
        categorySlug: 'mobiles',
        marketplaces: [{ name: 'Amazon', price: 900, url: 'https://example.com', inStock: true }],
        rating: 4.5,
        reviewCount: 100,
        pros: [],
        cons: [],
        specifications: {},
      },
      {
        id: 'p2',
        name: 'Dell Inspiron Laptop',
        slug: 'dell-inspiron-laptop',
        description: 'Test Dell Laptop',
        image: '/test.jpg',
        price: 40000,
        originalPrice: 50000,
        discountPercent: 20,
        dealType: 'Featured Deal',
        category: 'Laptops',
        categorySlug: 'laptops',
        marketplaces: [{ name: 'Amazon', price: 40000, url: 'https://example.com', inStock: true }],
        rating: 4.8,
        reviewCount: 50,
        featured: true,
        pros: [],
        cons: [],
        specifications: {},
      },
      {
        id: 'p3',
        name: 'Regular Mechanical Keyboard',
        slug: 'regular-mechanical-keyboard',
        description: 'Regular keyboard with zero discount',
        image: '/test.jpg',
        price: 1499,
        originalPrice: 1499,
        discountPercent: 0,
        dealType: 'Regular',
        category: 'Electronics',
        categorySlug: 'electronics',
        marketplaces: [{ name: 'Flipkart', price: 1499, url: 'https://example.com', inStock: true }],
        rating: 4.2,
        reviewCount: 20,
        pros: [],
        cons: [],
        specifications: {},
      },
      {
        id: 'p4',
        name: 'Fastrack Watch 45% Off',
        slug: 'fastrack-watch-45',
        description: 'Test watch with 45% discount',
        image: '/test.jpg',
        price: 1100,
        originalPrice: 2000,
        discountPercent: 45,
        dealType: 'Flash Deal',
        category: 'Watches',
        categorySlug: 'watches',
        marketplaces: [{ name: 'Myntra', price: 1100, url: 'https://example.com', inStock: true }],
        rating: 4.0,
        reviewCount: 80,
        pros: [],
        cons: [],
        specifications: {},
      },
      {
        id: 'p5',
        name: 'Clearance T-Shirt 92% Off',
        slug: 'clearance-tshirt-92',
        description: 'Test t-shirt with 92% discount',
        image: '/test.jpg',
        price: 80,
        originalPrice: 1000,
        discountPercent: 92,
        dealType: 'Major Discount',
        category: 'Fashion',
        categorySlug: 'fashion',
        marketplaces: [{ name: 'AJIO', price: 80, url: 'https://example.com', inStock: true }],
        rating: 3.9,
        reviewCount: 15,
        pros: [],
        cons: [],
        specifications: {},
      },
    ];

    // Test 1: Discount 10% filter
    const res10 = filterAndSortProducts(sampleProducts, { discountRange: 10 });
    assert('Filter discountRange=10 returns only p1 (10% discount)', res10.length === 1 && res10[0].id === 'p1');

    // Test 2: Discount 20% filter
    const res20 = filterAndSortProducts(sampleProducts, { discountRange: 20 });
    assert('Filter discountRange=20 returns only p2 (20% discount)', res20.length === 1 && res20[0].id === 'p2');

    // Test 3: Discount 40% filter
    const res40 = filterAndSortProducts(sampleProducts, { discountRange: 40 });
    assert('Filter discountRange=40 returns only p4 (45% discount in 40-49% bucket)', res40.length === 1 && res40[0].id === 'p4');

    // Test 4: Discount 90%+ filter
    const res90 = filterAndSortProducts(sampleProducts, { discountRange: 90 });
    assert('Filter discountRange=90 returns only p5 (92% discount in 90%+ bucket)', res90.length === 1 && res90[0].id === 'p5');

    // Test 5: Regular product with 0% discount never appears in any discount bucket
    const allBucketsMatched = PRODUCT_DISCOUNT_OPTIONS.flatMap((opt) => 
      filterAndSortProducts(sampleProducts, { discountRange: opt.value })
    );
    assert('Regular product (0% discount) is never returned by any discount filter', 
      !allBucketsMatched.some((p) => p.id === 'p3')
    );

    // Test 6: DealType "Regular" filter
    const resRegular = filterAndSortProducts(sampleProducts, { dealType: 'Regular' as DealType });
    assert('Filter dealType="Regular" successfully returns the Regular keyboard', resRegular.length === 1 && resRegular[0].id === 'p3');

    // Test 7: Search + Discount filter
    const resSearchDiscount = filterAndSortProducts(sampleProducts, { searchQuery: 'samsung', discountRange: 10 });
    assert('Search "samsung" + discountRange=10 matches p1', resSearchDiscount.length === 1 && resSearchDiscount[0].id === 'p1');

    const resSearchMismatch = filterAndSortProducts(sampleProducts, { searchQuery: 'samsung', discountRange: 20 });
    assert('Search "samsung" + discountRange=20 yields 0 results', resSearchMismatch.length === 0);

    // Test 8: Category + Discount filter
    const resCatDiscount = filterAndSortProducts(sampleProducts, { category: 'laptops', discountRange: 20 });
    assert('Category "laptops" + discountRange=20 matches Dell laptop', resCatDiscount.length === 1 && resCatDiscount[0].id === 'p2');

    // Test 9: Discount + Sorting
    const sortedDesc = filterAndSortProducts(sampleProducts, {}, 'discount-desc');
    assert('Sorting by discount-desc places 92% first, followed by 45%, 20%, 10%, 0%', 
      sortedDesc[0].id === 'p5' && sortedDesc[1].id === 'p4' && sortedDesc[sortedDesc.length - 1].id === 'p3'
    );
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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
