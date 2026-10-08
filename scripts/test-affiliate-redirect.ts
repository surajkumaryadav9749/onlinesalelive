import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { NextRequest } from 'next/server';
import { connectToDatabase } from '../src/lib/db';
import { isAllowedMarketplaceUrl } from '../src/lib/marketplaces';
import { Product } from '../src/models/Product';
import { AffiliateClick } from '../src/models/AffiliateClick';
import { GET } from '../src/app/go/[marketplace]/[identifier]/route';

async function runTests() {
  console.log('===============================================================');
  console.log('FLIPKART & EARNKARO AFFILIATE REDIRECT TEST SUITE');
  console.log('===============================================================\n');

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

  // =========================================================================
  // Part 1: REQUIREMENT 14 URL & HOSTNAME VALIDATION TESTS
  // =========================================================================
  console.log('--- 1. REQUIREMENT 14 HOSTNAME VALIDATION SUITE ---');

  // A. Direct Flipkart URL (allowed)
  assert(
    '14.A Direct Flipkart URLs allowed (www.flipkart.com, flipkart.com, dl.flipkart.com, fkrt.it)',
    isAllowedMarketplaceUrl('flipkart', 'https://www.flipkart.com/item/p/itm123?affid=test') === true &&
    isAllowedMarketplaceUrl('Flipkart', 'https://flipkart.com/item/p/itm123') === true &&
    isAllowedMarketplaceUrl('flipkart', 'https://dl.flipkart.com/dl/item/p/itm123') === true &&
    isAllowedMarketplaceUrl('Flipkart', 'https://fkrt.it/9xyz') === true &&
    isAllowedMarketplaceUrl('Flipkart', 'https://fkrt.co/xyz') === true
  );

  // B. EarnKaro fktr.in URL (allowed)
  assert(
    '14.B EarnKaro fktr.in URLs allowed (fktr.in, www.fktr.in)',
    isAllowedMarketplaceUrl('flipkart', 'https://fktr.in/tgWnhwK') === true &&
    isAllowedMarketplaceUrl('Flipkart', 'https://fktr.in/XXXXXXXX') === true &&
    isAllowedMarketplaceUrl('flipkart', 'https://www.fktr.in/tgWnhwK') === true
  );

  // C. Legitimate EarnKaro redirect hostname if required by redirect chain (allowed only if explicitly allowlisted)
  assert(
    '14.C Explicitly allowlisted EarnKaro trackingv3.linkredirect.in allowed',
    isAllowedMarketplaceUrl('flipkart', 'https://trackingv3.linkredirect.in/visitretailer/2276?id=5697667&shareid=tgWnhwK') === true &&
    isAllowedMarketplaceUrl('Flipkart', 'https://trackingv3.linkredirect.in/visitretailer/999') === true
  );

  assert(
    '14.C Non-allowlisted / arbitrary linkredirect.in hostnames strictly rejected',
    isAllowedMarketplaceUrl('flipkart', 'https://linkredirect.in/visitretailer/2276') === false &&
    isAllowedMarketplaceUrl('flipkart', 'https://other.linkredirect.in/visitretailer/2276') === false &&
    isAllowedMarketplaceUrl('flipkart', 'https://sub.trackingv3.linkredirect.in/visitretailer/2276') === false &&
    isAllowedMarketplaceUrl('flipkart', 'https://evil.linkredirect.in') === false
  );

  // D. Amazon URL under Flipkart marketplace (rejected)
  assert(
    '14.D Amazon URL under Flipkart marketplace strictly rejected',
    isAllowedMarketplaceUrl('flipkart', 'https://www.amazon.in/dp/B0BDK62PDX') === false &&
    isAllowedMarketplaceUrl('Flipkart', 'https://amzn.to/3XABC') === false
  );

  // E. Arbitrary external URL (rejected)
  assert(
    '14.E Arbitrary external URLs strictly rejected',
    isAllowedMarketplaceUrl('flipkart', 'https://evil-phishing-site.com/steal-creds') === false &&
    isAllowedMarketplaceUrl('Flipkart', 'https://google.com') === false &&
    isAllowedMarketplaceUrl('flipkart', 'https://example.com/item/123') === false
  );

  // F. Lookalike / malicious hostnames (rejected)
  assert(
    '14.F Lookalike and spoofed hostnames strictly rejected',
    isAllowedMarketplaceUrl('flipkart', 'https://fktr.in.evil.com/tgWnhwK') === false &&
    isAllowedMarketplaceUrl('Flipkart', 'https://evil-fktr.in/tgWnhwK') === false &&
    isAllowedMarketplaceUrl('flipkart', 'https://flipkart.com.evil.com/item') === false &&
    isAllowedMarketplaceUrl('Flipkart', 'https://evil-flipkart.com/item') === false &&
    isAllowedMarketplaceUrl('flipkart', 'https://trackingv3.linkredirect.in.evil.com/test') === false &&
    isAllowedMarketplaceUrl('Flipkart', 'https://evil-trackingv3.linkredirect.in/test') === false
  );

  // G. Malformed URLs (rejected)
  assert(
    '14.G Malformed, empty, hash, and non-HTTPS URLs strictly rejected',
    isAllowedMarketplaceUrl('flipkart', 'http://fktr.in/tgWnhwK') === false &&
    isAllowedMarketplaceUrl('Flipkart', 'javascript:alert(1)') === false &&
    isAllowedMarketplaceUrl('flipkart', 'not-a-valid-url') === false &&
    isAllowedMarketplaceUrl('Flipkart', '#') === false &&
    isAllowedMarketplaceUrl('flipkart', '') === false &&
    isAllowedMarketplaceUrl('Flipkart', '   ') === false
  );

  // H. Existing Amazon redirect tests (all pass)
  assert(
    '14.H Existing Amazon validation rules remain intact and pass',
    isAllowedMarketplaceUrl('Amazon', 'https://www.amazon.in/dp/B0BDK62PDX') === true &&
    isAllowedMarketplaceUrl('amazon', 'https://amzn.to/3XABC') === true &&
    isAllowedMarketplaceUrl('Amazon', 'https://amazon.in.attacker.com/dp/test') === false &&
    isAllowedMarketplaceUrl('Amazon', 'https://evil-phishing-site.com/steal-creds') === false &&
    isAllowedMarketplaceUrl('Amazon', 'https://fktr.in/tgWnhwK') === false
  );

  // =========================================================================
  // Part 2: END-TO-END ROUTE HANDLER & DATABASE VERIFICATION
  // =========================================================================
  console.log('\n--- 2. END-TO-END /go/[marketplace]/[identifier] ROUTE VERIFICATION ---');

  await connectToDatabase();

  const targetSlug = 'vdlooks-men-regular-fit-striped-spread-collar-casual-shirt-yellow';
  const product = await Product.findOne({ slug: targetSlug }).lean();

  assert('Target product exists in MongoDB database', !!product);
  if (!product) {
    console.error('Target product not found in database. Aborting route test.');
    process.exit(1);
  }

  const flipkartOffer = product.marketplaces?.find(
    (m) => m.name.toLowerCase() === 'flipkart'
  );
  assert(
    'Target product has active Flipkart offer with EarnKaro affiliate link',
    !!flipkartOffer &&
    flipkartOffer.isAffiliate === true &&
    flipkartOffer.affiliateUrl === 'https://fktr.in/tgWnhwK'
  );

  // Count existing clicks for this product before test
  const clickCountBefore = await AffiliateClick.countDocuments({
    productSlug: targetSlug,
    marketplace: 'Flipkart',
  });

  // Construct request to /go/flipkart/vdlooks-men-regular-fit-striped-spread-collar-casual-shirt-yellow
  const requestUrl = `https://onlinesalelive.in/go/flipkart/${targetSlug}?source=product_card`;
  const req = new NextRequest(requestUrl, {
    headers: {
      'user-agent': 'TestRunner/1.0',
      referer: 'https://onlinesalelive.in/product/' + targetSlug,
    },
  });

  const response = await GET(req, {
    params: Promise.resolve({
      marketplace: 'flipkart',
      identifier: targetSlug,
    }),
  });

  // Check response status
  assert(
    'Route returns HTTP 307 temporary redirect status (NOT 400 Bad Request)',
    response.status === 307,
    `Actual status: ${response.status}`
  );

  // Check Location header
  const locationHeader = response.headers.get('location');
  assert(
    'Redirect destination preserved as stored EarnKaro affiliate URL (https://fktr.in/tgWnhwK)',
    locationHeader === 'https://fktr.in/tgWnhwK',
    `Actual Location: ${locationHeader}`
  );

  // Check robots header
  const robotsHeader = response.headers.get('x-robots-tag');
  assert(
    'Response includes anti-indexing X-Robots-Tag header',
    robotsHeader === 'noindex, nofollow',
    `Actual X-Robots-Tag: ${robotsHeader}`
  );

  // Give non-blocking AffiliateClick.create time to persist
  await new Promise((r) => setTimeout(r, 600));

  // Verify AffiliateClick was recorded
  const clickCountAfter = await AffiliateClick.countDocuments({
    productSlug: targetSlug,
    marketplace: 'Flipkart',
  });

  assert(
    'AffiliateClick tracking recorded in database',
    clickCountAfter > clickCountBefore,
    `Before: ${clickCountBefore}, After: ${clickCountAfter}`
  );

  const latestClick = await AffiliateClick.findOne({
    productSlug: targetSlug,
    marketplace: 'Flipkart',
  }).sort({ createdAt: -1 }).lean();

  assert(
    'AffiliateClick record preserves EarnKaro affiliate URL destination',
    latestClick?.destinationUrl === 'https://fktr.in/tgWnhwK' &&
    latestClick?.isAffiliate === true &&
    latestClick?.marketplace === 'Flipkart'
  );

  // Clean up the test click
  if (latestClick?._id) {
    await AffiliateClick.deleteOne({ _id: latestClick._id });
    console.log('  ✓ Cleaned up test AffiliateClick record');
  }

  // =========================================================================
  // Part 3: SECURITY REGRESSION ON ROUTE HANDLER
  // =========================================================================
  console.log('\n--- 3. ROUTE HANDLER SECURITY REGRESSION TESTS ---');

  // Test invalid marketplace
  const invalidMarketplaceReq = new NextRequest(
    'https://onlinesalelive.in/go/unsupported/test',
    {}
  );
  const invalidMarketplaceRes = await GET(invalidMarketplaceReq, {
    params: Promise.resolve({
      marketplace: 'unsupported',
      identifier: 'test',
    }),
  });
  assert(
    'Unsupported marketplace returns 404',
    invalidMarketplaceRes.status === 404
  );

  console.log('\n===============================================================');
  console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
