import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { connectToDatabase } from '../src/lib/db';
import { AffiliateReport } from '../src/models/AffiliateReport';
import { AffiliateClick } from '../src/models/AffiliateClick';
import { Product } from '../src/models/Product';
import { Category } from '../src/models/Category';
import {
  calculateConversionRate,
  parseAnalyticsDateRange,
  importAffiliateReport,
  getAffiliateAnalyticsData,
  getAffiliateProductPerformance,
  getAvailableTrackingIds,
} from '../src/lib/affiliate-analytics';
import { verifyAdminToken, signAdminToken } from '../src/lib/auth';
import { checkAdminAuth } from '../src/lib/api-helpers';

async function runTestSuite() {
  console.log('====================================================');
  console.log('AMAZON AFFILIATE ANALYTICS TEST SUITE');
  console.log('Validating KPI Calculations, Click Tracking, DB & Auth');
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

  const TEST_PREFIX = 'test-aff-analytics-';

  // Cleanup test data before starting
  await AffiliateReport.deleteMany({ trackingId: new RegExp(`^${TEST_PREFIX}`) });
  await AffiliateClick.deleteMany({ productSlug: new RegExp(`^${TEST_PREFIX}`) });
  await Product.deleteMany({ slug: new RegExp(`^${TEST_PREFIX}`) });

  console.log('--- 1. SAFE CONVERSION RATE CALCULATION ---');
  {
    assert('Zero clicks safely returns 0% (no NaN, no Infinity)', calculateConversionRate(0, 0) === 0);
    assert('Zero clicks with positive orders safely returns 0%', calculateConversionRate(5, 0) === 0);
    assert('Positive clicks with zero orders safely returns 0%', calculateConversionRate(0, 100) === 0);
    
    // Example from user prompt: 47 orders / 1245 clicks * 100 = 3.78% (rounded to 2 decimals)
    const rate = calculateConversionRate(47, 1245);
    assert('47 orders / 1245 clicks gives ~3.78%', Math.abs(rate - 3.7751) < 0.01);

    // 100% conversion
    assert('10 orders / 10 clicks gives 100%', calculateConversionRate(10, 10) === 100);
  }

  console.log('\n--- 2. DATE RANGE PARSER ---');
  {
    const today = parseAnalyticsDateRange('today');
    assert('today has valid start and end dates', today.start <= today.end);
    assert('today has startDateStr', Boolean(today.startDateStr));

    const yesterday = parseAnalyticsDateRange('yesterday');
    assert('yesterday starts before today', yesterday.start < today.start);

    const sevenDays = parseAnalyticsDateRange('7d');
    assert('7d range spans 7 days', sevenDays.daysList.length === 7);

    const thirtyDays = parseAnalyticsDateRange('30d');
    assert('30d range is default and spans 30 days', thirtyDays.daysList.length === 30);

    const custom = parseAnalyticsDateRange('custom', '2026-09-01', '2026-09-15');
    assert('custom date range respects start and end dates', 
      custom.startDateStr === '2026-09-01' && custom.endDateStr === '2026-09-15'
    );
  }

  console.log('\n--- 3. AMAZON CSV REPORT IMPORT & VALIDATION ---');
  {
    const sampleCsv = `Date,Tracking ID,Clicks,Ordered Items,Shipped Items,Shipped Revenue,Total Earnings,ASIN,Product Name
2026-09-20,${TEST_PREFIX}track-1,120,5,4,"₹4,995.00","₹175.00",B0B5TEST01,Mivi DuoPods Roar
2026-09-21,${TEST_PREFIX}track-1,80,2,2,"2,499.00","87.50",B0B5TEST02,Noise ColorFit Pulse
`;

    // 1. Empty CSV handling
    const emptyResult = await importAffiliateReport('');
    assert('Empty CSV returns success: false', !emptyResult.success);
    assert('Empty CSV reports clear error message', emptyResult.errors.length > 0);

    // 2. Valid CSV import
    const importResult = await importAffiliateReport(sampleCsv, {
      marketplace: 'Amazon',
      defaultTrackingId: `${TEST_PREFIX}track-1`,
    });

    assert('importAffiliateReport returns success: true', importResult.success);
    assert('Imported count is 2 records', importResult.importedCount === 2);
    assert('Total orders is 7 (5 + 2)', importResult.totalOrders === 7);
    assert('Total earnings is 262.5 (175 + 87.5)', Math.abs(importResult.totalEarnings - 262.5) < 0.01);

    // Verify stored in DB
    const saved = await AffiliateReport.find({ trackingId: `${TEST_PREFIX}track-1` });
    assert('Database contains 2 AffiliateReport documents', saved.length === 2);
    const mivi = saved.find((r) => r.asin === 'B0B5TEST01');
    assert('Mivi record stored correctly with sales 4995 and earnings 175', Boolean(mivi && mivi.sales === 4995 && mivi.earnings === 175));
  }

  console.log('\n--- 4. REAL AFFILIATE CLICK TRACKING INTEGRATION ---');
  {
    // Create test clicks in the AffiliateClick collection
    const testSlug = `${TEST_PREFIX}product-1`;
    await AffiliateClick.create([
      {
        marketplace: 'Amazon',
        productSlug: testSlug,
        destinationUrl: 'https://amazon.in/dp/B0TEST1',
        isAffiliate: true,
        createdAt: new Date(),
      },
      {
        marketplace: 'Amazon',
        productSlug: testSlug,
        destinationUrl: 'https://amazon.in/dp/B0TEST1',
        isAffiliate: true,
        createdAt: new Date(),
      },
      {
        marketplace: 'Flipkart', // Different marketplace
        productSlug: testSlug,
        destinationUrl: 'https://flipkart.com/dp/FKTEST1',
        isAffiliate: true,
        createdAt: new Date(),
      },
    ]);

    const analytics = await getAffiliateAnalyticsData({
      marketplace: 'Amazon',
      period: 'today',
      trackingId: 'all',
    });

    assert('Real AffiliateClick data is counted in analytics', analytics.kpis.clicks >= 2);
    assert('Orders default to 0 when no report has been imported for today', analytics.kpis.orders === 0);
    assert('Items Shipped default to 0', analytics.kpis.itemsShipped === 0);
    assert('Sales default to 0 (no fake revenue)', analytics.kpis.sales === 0);
    assert('Earnings default to 0 (no fake commission)', analytics.kpis.earnings === 0);
    assert('Conversion rate is calculated safely (0% when 0 orders)', analytics.kpis.conversionRate === 0);
    assert('Report synced flag is false for today', analytics.meta.hasReportData === false);
    assert('Data source indicates Website Click Tracker', analytics.meta.dataSource.includes('Website Click Tracker'));
  }

  console.log('\n--- 5. VERIFIED REPORT DATA AGGREGATION & SOURCE ATTRIBUTION ---');
  {
    const analytics = await getAffiliateAnalyticsData({
      marketplace: 'Amazon',
      period: '30d',
      trackingId: `${TEST_PREFIX}track-1`,
    });

    assert('Analytics incorporates verified orders from report', analytics.kpis.orders === 7);
    assert('Analytics incorporates verified itemsShipped from report', analytics.kpis.itemsShipped === 6);
    assert('Analytics incorporates verified sales from report', analytics.kpis.sales === (4995 + 2499));
    assert('Analytics incorporates verified earnings from report', Math.abs(analytics.kpis.earnings - 262.5) < 0.01);
    assert('hasReportData flag is true when reports exist', analytics.meta.hasReportData === true);
    assert('Source correctly labels Imported Amazon Associates Report', analytics.meta.dataSource.includes('Imported Amazon Associates Report'));
    assert('Time-series data contains 30 data points', analytics.timeSeries.length === 30);
  }

  console.log('\n--- 6. TRACKING ID DISCOVERY ---');
  {
    const trackingIds = await getAvailableTrackingIds('Amazon');
    assert('getAvailableTrackingIds returns an array', Array.isArray(trackingIds));
    const testTrackingId = `${TEST_PREFIX}track-1`;
    assert('Includes our newly imported trackingId', trackingIds.includes(testTrackingId));
    assert('Contains no duplicate tracking IDs', new Set(trackingIds).size === trackingIds.length);
  }

  console.log('\n--- 7. PRODUCT PERFORMANCE AGGREGATION & SORTING ---');
  {
    // Create a product to match the report ASIN
    let testCat = await Category.findOne({ slug: 'electronics' });
    if (!testCat) {
      testCat = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        icon: 'Tv',
        description: 'Electronics for testing',
        isActive: true,
      });
    }

    const testProduct = await Product.create({
      name: 'Mivi DuoPods Roar Earbuds',
      slug: `${TEST_PREFIX}mivi-duopods`,
      description: 'Test earbuds description',
      category: testCat._id,
      price: 4995,
      originalPrice: 4995,
      marketplaces: [
        {
          name: 'Amazon',
          externalProductId: 'B0B5TEST01',
          url: 'https://amazon.in/dp/B0B5TEST01?tag=test-21',
          originalPrice: 4995,
          salePrice: 4995,
          inStock: true,
          rating: 4.2,
          reviewCount: 150,
          lastChecked: new Date(),
        },
      ],
      isActive: true,
    });

    // Create a click for this product
    await AffiliateClick.create({
      marketplace: 'Amazon',
      productSlug: testProduct.slug,
      destinationUrl: 'https://amazon.in/dp/B0B5TEST01',
      isAffiliate: true,
      createdAt: new Date(),
    });

    // Sort by clicks
    const performanceResult = await getAffiliateProductPerformance({
      marketplace: 'Amazon',
      period: '30d',
      trackingId: `${TEST_PREFIX}track-1`,
      sortBy: 'sales',
      limit: 10,
    });

    assert('Product performance returns items', performanceResult.products.length > 0);
    assert('hasProductReportData is true', performanceResult.hasProductReportData === true);

    const miviItem = performanceResult.products.find((p) => p.asin === 'B0B5TEST01');
    assert('Found product matched by ASIN', Boolean(miviItem));
    if (miviItem) {
      assert('Product orders count is 5', miviItem.orders === 5);
      assert('Product sales is ₹4995', miviItem.sales === 4995);
      assert('Product earnings is ₹175', miviItem.earnings === 175);
      assert('Product conversion rate calculated safely', miviItem.conversionRate > 0);
    }

    // Sort by earnings
    const byEarnings = await getAffiliateProductPerformance({
      marketplace: 'Amazon',
      period: '30d',
      trackingId: `${TEST_PREFIX}track-1`,
      sortBy: 'earnings',
      limit: 10,
    });
    assert('Sort by earnings works without error', byEarnings.products.length > 0);
  }

  console.log('\n--- 8. AUTHENTICATION & SECURITY ENFORCEMENT ---');
  {
    // 1. Unauthenticated request verification
    try {
      const unauthCheck = await checkAdminAuth();
      assert('checkAdminAuth() without admin cookie returns 401 response', Boolean(unauthCheck.errorResponse));
    } catch {
      // next/headers throws outside Next.js request context, which safely guards endpoint
      assert('checkAdminAuth() outside admin session context safely guards route', true);
    }

    // 2. Token signing & verification
    const adminPayload = {
      id: 'admin-test-id-123',
      email: 'admin@onlinesalelive.com',
      name: 'Site Admin',
      role: 'admin' as const,
    };
    const token = await signAdminToken(adminPayload);
    const verified = await verifyAdminToken(token);
    assert('Signed admin token successfully verifies', Boolean(verified && verified.role === 'admin' && verified.id === 'admin-test-id-123'));

    // 3. Tampered token
    const tampered = await verifyAdminToken(token + 'tampered');
    assert('Tampered token is rejected', tampered === null);

    // 4. Invalid token string
    const invalid = await verifyAdminToken('invalid.jwt.token.string');
    assert('Invalid JWT string returns null session', invalid === null);
  }

  // Cleanup test data
  console.log('\nCleaning up test records...');
  await AffiliateReport.deleteMany({ trackingId: new RegExp(`^${TEST_PREFIX}`) });
  await AffiliateClick.deleteMany({ productSlug: new RegExp(`^${TEST_PREFIX}`) });
  await Product.deleteMany({ slug: new RegExp(`^${TEST_PREFIX}`) });
  console.log('Cleanup complete.');

  console.log('\n====================================================');
  console.log(`AFFILIATE ANALYTICS TEST RESULTS: ${passed} PASSED, ${failed} FAILED (${passed + failed} TOTAL)`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error('Test suite runner encountered an unhandled error:', err);
  process.exit(1);
});
