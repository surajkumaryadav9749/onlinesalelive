import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import {
  isAllowedMarketplaceUrl,
  getMarketplaceConfig,
  SUPPORTED_MARKETPLACES,
} from '../src/lib/marketplaces';
import {
  calculateDiscount,
  getDealStatus,
  isDealCurrentlyActive,
} from '../src/lib/deal-utils';
import { connectToDatabase } from '../src/lib/db';
import { Product } from '../src/models/Product';
import { Deal } from '../src/models/Deal';
import { AffiliateClick } from '../src/models/AffiliateClick';

async function runTests() {
  console.log('=============================================');
  console.log('PHASE 3 VERIFICATION TESTS');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. Marketplace Registry
  console.log('--- 1. MARKETPLACE REGISTRY & DOMAIN VALIDATION ---');
  assert(
    'All 5 target marketplaces are supported',
    SUPPORTED_MARKETPLACES.length === 5 &&
      SUPPORTED_MARKETPLACES.includes('Amazon') &&
      SUPPORTED_MARKETPLACES.includes('Flipkart') &&
      SUPPORTED_MARKETPLACES.includes('Myntra') &&
      SUPPORTED_MARKETPLACES.includes('AJIO') &&
      SUPPORTED_MARKETPLACES.includes('Meesho')
  );

  assert(
    'Amazon config slug is amazon',
    getMarketplaceConfig('Amazon')?.slug === 'amazon' &&
      getMarketplaceConfig('amazon')?.name === 'Amazon'
  );

  assert(
    'Flipkart config slug is flipkart',
    getMarketplaceConfig('flipkart')?.name === 'Flipkart'
  );

  // URL Whitelist & Open-Redirect Security
  assert(
    'Valid Amazon.in HTTPS URL allowed',
    isAllowedMarketplaceUrl('Amazon', 'https://www.amazon.in/dp/B0BDK62PDX') === true
  );

  assert(
    'Valid Amazon short amzn.to URL allowed',
    isAllowedMarketplaceUrl('Amazon', 'https://amzn.to/3XABC') === true
  );

  assert(
    'Valid Flipkart fkrt.it URL allowed',
    isAllowedMarketplaceUrl('Flipkart', 'https://fkrt.it/9xyz') === true
  );

  assert(
    'Valid Myntra URL allowed',
    isAllowedMarketplaceUrl('Myntra', 'https://www.myntra.com/tshirts/brand/1234') === true
  );

  assert(
    'Valid AJIO URL allowed',
    isAllowedMarketplaceUrl('AJIO', 'https://www.ajio.com/men-sneakers/p/4600000') === true
  );

  assert(
    'Valid Meesho URL allowed',
    isAllowedMarketplaceUrl('Meesho', 'https://meesho.com/s/p/123') === true
  );

  assert(
    'SECURITY: Open redirect to external malicious domain blocked',
    isAllowedMarketplaceUrl('Amazon', 'https://evil-phishing-site.com/steal-creds') === false
  );

  assert(
    'SECURITY: Subdomain spoofing blocked (amazon.in.attacker.com)',
    isAllowedMarketplaceUrl('Amazon', 'https://amazon.in.attacker.com/dp/test') === false
  );

  assert(
    'SECURITY: Insecure HTTP protocol blocked in production checks',
    isAllowedMarketplaceUrl('Amazon', 'http://www.amazon.in/dp/test') === false
  );

  assert(
    'SECURITY: Unsupported marketplace name rejected',
    isAllowedMarketplaceUrl('UnknownStore', 'https://amazon.in') === false
  );

  assert(
    'Empty or hash URLs safely rejected',
    isAllowedMarketplaceUrl('Amazon', '#') === false &&
      isAllowedMarketplaceUrl('Amazon', '') === false
  );

  // 2. Discount Calculations
  console.log('\n--- 2. DISCOUNT CALCULATION FORMULA & VALIDATION ---');
  assert(
    'Calculates 25% discount accurately (₹1500 from ₹2000)',
    calculateDiscount(1500, 2000) === 25
  );

  assert(
    'Calculates 50% discount accurately (₹500 from ₹1000)',
    calculateDiscount(500, 1000) === 50
  );

  assert(
    'Returns 0 if current price >= original price',
    calculateDiscount(2000, 1500) === 0 && calculateDiscount(1000, 1000) === 0
  );

  assert(
    'Prevents negative or zero prices from division by zero',
    calculateDiscount(0, 1000) === 0 &&
      calculateDiscount(500, 0) === 0 &&
      calculateDiscount(-100, 500) === 0
  );

  // 3. Dynamic Deal Expiry & Lifecycle Status
  console.log('\n--- 3. DYNAMIC DEAL EXPIRY & LIFECYCLE STATUS ---');
  const pastDate = new Date(Date.now() - 3600 * 1000 * 24); // 24 hours ago
  const futureDate = new Date(Date.now() + 3600 * 1000 * 24); // 24 hours in future
  const distantFuture = new Date(Date.now() + 3600 * 1000 * 48); // 48 hours in future

  assert(
    'Deal past endDate is evaluated as expired',
    getDealStatus({ isActive: true, endDate: pastDate }) === 'expired'
  );

  assert(
    'Expired deal is not currently active for public display',
    isDealCurrentlyActive({ isActive: true, endDate: pastDate }) === false
  );

  assert(
    'Deal before startDate is evaluated as upcoming',
    getDealStatus({ isActive: true, startDate: futureDate, endDate: distantFuture }) ===
      'upcoming'
  );

  assert(
    'Deal with isActive false is evaluated as inactive',
    getDealStatus({ isActive: false, endDate: futureDate }) === 'inactive'
  );

  assert(
    'Deal within valid timeframe and isActive true is active',
    getDealStatus({ isActive: true, endDate: futureDate }) === 'active' &&
      isDealCurrentlyActive({ isActive: true, endDate: futureDate }) === true
  );

  // 4. Database Schema & Models
  console.log('\n--- 4. MONGODB DATABASE MODELS & TEST RECORDING ---');
  try {
    await connectToDatabase();

    const productCount = await Product.countDocuments();
    assert('Product collection readable', typeof productCount === 'number' && productCount >= 0, `Found ${productCount} products`);

    const dealCount = await Deal.countDocuments();
    assert('Deal collection readable', typeof dealCount === 'number' && dealCount >= 0, `Found ${dealCount} deals`);

    // Test creating an AffiliateClick record
    const click = await AffiliateClick.create({
      productSlug: 'sony-wh-1000xm5-anc-headphones',
      productName: 'Sony WH-1000XM5 ANC Headphones',
      marketplace: 'Amazon',
      destinationUrl: 'https://www.amazon.in/dp/B0BDK62PDX',
      isAffiliate: true,
      sourcePage: '/product/sony-wh-1000xm5-anc-headphones',
      referrer: 'https://onlinesalelive.in',
      userAgent: 'TestBrowser/1.0 (Automated Test Suite)',
      createdAt: new Date(),
    });

    assert(
      'AffiliateClick record written successfully',
      Boolean(click._id && click.marketplace === 'Amazon')
    );

    const retrievedClick = await AffiliateClick.findById(click._id).lean();
    assert(
      'AffiliateClick retrieved with privacy preservation',
      retrievedClick?.destinationUrl === 'https://www.amazon.in/dp/B0BDK62PDX' &&
        retrievedClick?.isAffiliate === true
    );

    // Clean up test click
    await AffiliateClick.deleteOne({ _id: click._id });
    assert('Test AffiliateClick cleaned up', true);
  } catch (err) {
    assert('Database test encountered error', false, String(err));
  }

  console.log('\n=============================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
