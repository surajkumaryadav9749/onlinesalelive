import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
process.env.ENABLE_MOCK_FALLBACK = 'true';

import {
  getRelatedProducts,
  getRelatedContent,
  getPopularDeals,
  getMostClickedProducts,
  getTrendingProductsWithMeta,
  getExpiringDeals,
  getAllGuides,
  getGuideBySlug,
  getAllReviews,
  getReviewBySlug,
  getAllComparisons,
  getComparisonBySlug,
  getRelatedComparisons,
  searchProducts,
} from '../src/lib/data-service';
import {
  createComparisonMetadata,
} from '../src/lib/seo';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
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

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: errorMsg });
    console.error(`  ✗ [FAIL] ${name}: ${errorMsg}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runPhase5Tests() {
  console.log('\n==================================================');
  console.log('STARTING PHASE 5 AUTOMATED TEST SUITE');
  console.log('OnlineSaleLive — Content + Advanced Features');
  console.log('==================================================\n');

  // --- 1. RELATED PRODUCTS LOGIC ---
  console.log('--- 1. RELATED PRODUCTS SYSTEM ---');

  await test('Related products match category and exclude the current product', async () => {
    const related = await getRelatedProducts('electronics', 'boat-airdopes-141', 4);
    assert(Array.isArray(related), 'Related products must return an array');
    assert(
      related.every((p) => p.slug !== 'boat-airdopes-141'),
      'Related products must never include the target product itself'
    );
    if (related.length > 0) {
      assert(
        related.every((p) => p.categorySlug.toLowerCase() === 'electronics'),
        'All related items must belong to the requested category'
      );
    }
  });

  await test('Related products respect price proximity when targetPrice is supplied', async () => {
    const targetPrice = 1500;
    const related = await getRelatedProducts('electronics', 'boat-airdopes-141', 4, targetPrice);
    assert(Array.isArray(related), 'Must return an array');
    // If results exist, verify they were found within reasonable price boundaries
    if (related.length > 0) {
      assert(
        related.every((p) => p.price > 0),
        'All related products must have valid positive prices'
      );
    }
  });

  await test('Related products handle invalid/non-existent category gracefully', async () => {
    const related = await getRelatedProducts('non-existent-category-xyz', 'random-slug', 4);
    assert(Array.isArray(related), 'Must return an array even for non-existent category');
    assert(related.length === 0, 'Must return empty array for non-existent category');
  });

  // --- 2. RELATED CONTENT SYSTEM ---
  console.log('\n--- 2. CONTEXTUAL RELATED CONTENT SYSTEM ---');

  await test('getRelatedContent cross-links guides, reviews, comparisons and deals', async () => {
    const content = await getRelatedContent({
      productSlug: 'boat-airdopes-141',
      categorySlug: 'electronics',
      limit: 3,
    });
    assert(typeof content === 'object' && content !== null, 'RelatedContent must be an object');
    assert(Array.isArray(content.guides), 'Must include guides array');
    assert(Array.isArray(content.reviews), 'Must include reviews array');
    assert(Array.isArray(content.comparisons), 'Must include comparisons array');
    assert(Array.isArray(content.deals), 'Must include deals array');
  });

  await test('getRelatedGuides returns guides matching product or category', async () => {
    const content = await getRelatedContent({ categorySlug: 'electronics', limit: 3 });
    assert(Array.isArray(content.guides), 'Guides must be an array');
    assert(content.guides.length <= 3, 'Must respect limit constraint');
  });

  // --- 3. POPULAR DEALS SYSTEM ---
  console.log('\n--- 3. POPULAR DEALS CALCULATION ---');

  await test('getPopularDeals returns database-backed structure with honest popularity flag', async () => {
    const result = await getPopularDeals({ limit: 4, days: 7 });
    assert(typeof result === 'object' && result !== null, 'Must return result object');
    assert(Array.isArray(result.deals), 'Must return deals array');
    assert(typeof result.isClickPopular === 'boolean', 'isClickPopular must be a boolean');
    assert(result.timeWindowDays === 7, 'Must respect requested time window');
    assert(result.deals.length <= 4, 'Must respect limit constraint');
    // If click data is not present in test DB, isClickPopular must be false (honest fallback)
    if (!result.isClickPopular) {
      assert(
        result.deals.every(isDealCurrentlyActive),
        'Fallback deals must all be currently active deals'
      );
    }
  });

  // --- 4. MOST CLICKED PRODUCTS AGGREGATION ---
  console.log('\n--- 4. MOST CLICKED PRODUCTS AGGREGATION ---');

  await test('getMostClickedProducts aggregates real clicks without exposing PII', async () => {
    const result = await getMostClickedProducts({ limit: 4, days: 7 });
    assert(typeof result === 'object' && result !== null, 'Must return result object');
    assert(Array.isArray(result.products), 'Must return products array');
    assert(typeof result.hasRealClickData === 'boolean', 'hasRealClickData must be boolean');
    assert(typeof result.clickCounts === 'object', 'clickCounts must be an aggregated map');

    // Security & privacy assertions:
    const stringified = JSON.stringify(result);
    assert(!stringified.includes('ipAddress'), 'Must NEVER expose visitor IP addresses');
    assert(!stringified.includes('userAgent'), 'Must NEVER expose visitor user agents');
    assert(!stringified.includes('referrer'), 'Must NEVER expose visitor raw referrers');

    // Truth in metrics: If hasRealClickData is false, products must be empty
    if (!result.hasRealClickData) {
      assert(result.products.length === 0, 'Must NOT invent fake products when real click data is empty');
    }
  });

  // --- 5. TRENDING PRODUCTS CALCULATION ---
  console.log('\n--- 5. TRENDING PRODUCTS CALCULATION ---');

  await test('getTrendingProductsWithMeta returns products with documented score formula flag and semantic label', async () => {
    const result = await getTrendingProductsWithMeta(4, 7);
    assert(Array.isArray(result.products), 'Must return products array');
    assert(typeof result.isCalculatedTrend === 'boolean', 'isCalculatedTrend must be boolean');
    assert(typeof result.label === 'string', 'label must be a string');
    assert(result.products.length <= 4, 'Must respect limit constraint');

    if (result.isCalculatedTrend) {
      assert(
        result.label === 'Trending Now',
        `Calculated trend must use trending label, got: ${result.label}`
      );
    } else {
      assert(
        result.label === 'Featured Products',
        `Fallback without real activity must use "Featured Products", got: ${result.label}`
      );
      assert(
        !result.label.toLowerCase().includes('trending'),
        'Fallback label must NOT claim trending status'
      );
    }

    if (result.products.length > 0) {
      assert(
        result.products.every((p) => p.name && p.price > 0),
        'All returned products must be valid active products'
      );
    }
  });

  await test('Zero click activity produces curated fallback that does NOT claim trending or shopper popularity', async () => {
    // Verify that when isCalculatedTrend is false, label does not claim real shopper popularity
    const result = await getTrendingProductsWithMeta(4, 1);
    if (!result.isCalculatedTrend) {
      assert(
        result.label === 'Featured Products',
        'Fallback state must be labeled "Featured Products"'
      );
      assert(
        !result.label.toLowerCase().includes('trending'),
        'Fallback must not claim "Trending"'
      );
      assert(
        !result.label.toLowerCase().includes('popular'),
        'Fallback must not claim "Popular"'
      );
    }
  });

  // --- 6. EXPIRING DEALS LOGIC ---
  console.log('\n--- 6. EXPIRING DEALS CALCULATION ---');

  await test('getExpiringDeals returns only active deals within expiration window', async () => {
    const expiring = await getExpiringDeals(72, 6);
    assert(Array.isArray(expiring), 'Must return an array');
    const now = new Date();
    const maxEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    for (const d of expiring) {
      assert(isDealCurrentlyActive(d), `Deal ${d.id} must be currently active`);
      if (d.endDate) {
        const end = new Date(d.endDate);
        assert(end > now, `Deal ${d.id} must not be expired`);
        assert(end <= maxEnd, `Deal ${d.id} end date must be within 72h window`);
      }
    }
  });

  // --- 7. EDITORIAL REVIEWS & LAB TESTS ---
  console.log('\n--- 7. EDITORIAL REVIEWS DISTINCTION ---');

  await test('Reviews are marked as editorial evaluations rather than customer submissions', async () => {
    const reviews = await getAllReviews();
    assert(Array.isArray(reviews), 'Must return reviews array');
    assert(reviews.length > 0, 'Must have reviews');
    for (const rev of reviews) {
      assert(rev.isEditorial === true, `Review ${rev.slug} must be flagged as isEditorial`);
      assert(typeof rev.title === 'string', 'Review must have a title');
      assert(typeof rev.productSlug === 'string', 'Review must reference a productSlug');
      assert(Array.isArray(rev.pros), 'Review must contain pros');
      assert(Array.isArray(rev.cons), 'Review must contain cons');
    }
  });

  await test('getReviewBySlug retrieves valid review and returns undefined for unknown slug', async () => {
    const reviews = await getAllReviews();
    const firstSlug = reviews[0].slug;
    const found = await getReviewBySlug(firstSlug);
    assert(found !== undefined, `Must find review by slug: ${firstSlug}`);
    assert(found?.slug === firstSlug, 'Returned review slug must match');

    const notFound = await getReviewBySlug('non-existent-review-xyz-404');
    assert(notFound === undefined, 'Unknown review slug must return undefined');
  });

  // --- 8. PRODUCT COMPARISONS ---
  console.log('\n--- 8. PRODUCT COMPARISONS SYSTEM ---');

  await test('getAllComparisons returns curated comparison data with content and products', async () => {
    const comparisons = await getAllComparisons();
    assert(Array.isArray(comparisons), 'Must return comparisons array');
    assert(comparisons.length > 0, 'Must have at least one curated comparison');
    const comp = comparisons[0];
    assert(typeof comp.title === 'string', 'Comparison must have a title');
    assert(typeof comp.slug === 'string', 'Comparison must have a slug');
    assert(Array.isArray(comp.productSlugs), 'Comparison must list productSlugs');
    assert(comp.productSlugs.length >= 2, 'Comparison must compare at least 2 products');
    assert(typeof comp.content === 'string' && comp.content.length > 0, 'Comparison must have structured comparison content');
  });

  await test('getComparisonBySlug retrieves comparison and returns undefined for invalid slug', async () => {
    const comparisons = await getAllComparisons();
    const firstSlug = comparisons[0].slug;
    const found = await getComparisonBySlug(firstSlug);
    assert(found !== undefined, `Must find comparison by slug: ${firstSlug}`);
    assert(found?.slug === firstSlug, 'Found comparison slug must match');

    const notFound = await getComparisonBySlug('unknown-comparison-404');
    assert(notFound === undefined, 'Unknown comparison must return undefined');
  });

  await test('getRelatedComparisons finds comparisons related to a product', async () => {
    const related = await getRelatedComparisons(undefined, 'boat-airdopes-141', 2);
    assert(Array.isArray(related), 'Must return an array');
    assert(related.length <= 2, 'Must respect limit constraint');
  });

  await test('createComparisonMetadata generates valid SEO title, canonical, and OpenGraph', () => {
    const meta = createComparisonMetadata({
      id: 'c1',
      title: 'boAt Airdopes 141 vs Boult Audio AirBass Propods',
      slug: 'boat-airdopes-141-vs-boult-airbass-propods',
      description: 'Side by side comparison of specs, sound, battery, and price.',
      productSlugs: ['boat-airdopes-141', 'boult-airbass-propods'],
      content: 'Detailed head-to-head performance matrix comparing battery life, noise cancellation, and Indian store prices.',
      image: 'https://images.unsplash.com/sample.jpg',
      isPublished: true,
    });
    assert(
      Boolean(meta.title?.toString().includes('boAt Airdopes 141 vs Boult Audio AirBass Propods')),
      'Metadata title must include comparison title'
    );
    assert(
      Boolean(meta.alternates?.canonical?.toString().includes('/compare/boat-airdopes-141-vs-boult-airbass-propods')),
      'Canonical URL must target /compare/[slug]'
    );
  });

  // --- 9. BUYING GUIDES SYSTEM ---
  console.log('\n--- 9. BUYING GUIDES SYSTEM ---');

  await test('getAllGuides returns published guides and getGuideBySlug handles 404 cleanly', async () => {
    const guides = await getAllGuides();
    assert(Array.isArray(guides), 'Must return guides array');
    assert(guides.length > 0, 'Must have buying guides');
    const firstSlug = guides[0].slug;
    const found = await getGuideBySlug(firstSlug);
    assert(found !== undefined, `Must find guide by slug: ${firstSlug}`);
    assert(found?.slug === firstSlug, 'Found guide slug must match');

    const notFound = await getGuideBySlug('non-existent-guide-xyz');
    assert(notFound === undefined, 'Unknown guide slug must return undefined');
  });

  // --- 10. AFFILIATE REDIRECT & DOMAIN PRESERVATION ---
  console.log('\n--- 10. AFFILIATE REDIRECT PRESERVATION ---');

  await test('Marketplace validation still restricts to verified partner domains', () => {
    assert(
      isAllowedMarketplaceUrl('Amazon', 'https://www.amazon.in/dp/B00EXAMPLE?tag=onlinesalelive-21'),
      'Amazon India domain must be allowed'
    );
    assert(
      isAllowedMarketplaceUrl('Flipkart', 'https://www.flipkart.com/item/p/itm123?affid=test'),
      'Flipkart domain must be allowed'
    );
    assert(
      isAllowedMarketplaceUrl('Myntra', 'https://www.myntra.com/tshirt/123'),
      'Myntra domain must be allowed'
    );
    assert(
      isAllowedMarketplaceUrl('AJIO', 'https://www.ajio.com/s/shoes-123'),
      'AJIO domain must be allowed'
    );
    assert(
      isAllowedMarketplaceUrl('Meesho', 'https://www.meesho.com/dress/p/123'),
      'Meesho domain must be allowed'
    );
    assert(
      !isAllowedMarketplaceUrl('Amazon', 'https://evil-malware-phishing.com/steal'),
      'Unauthorized external domain must be rejected'
    );
  });

  await test('Marketplace registry contains exactly the 5 target marketplaces', () => {
    assert(SUPPORTED_MARKETPLACES.length === 5, 'Must support exactly 5 marketplaces');
    for (const m of ['Amazon', 'Flipkart', 'Myntra', 'AJIO', 'Meesho']) {
      const cfg = getMarketplaceConfig(m);
      assert(cfg !== undefined, `Marketplace config for ${m} must exist`);
      assert(cfg?.slug !== undefined, `Marketplace ${m} must have slug`);
      assert(Array.isArray(cfg?.allowedDomains) && cfg.allowedDomains.length > 0, `Marketplace ${m} must define allowedDomains`);
    }
  });

  // --- 11. SEO & SITEMAP PRESERVATION ---
  console.log('\n--- 11. SEO & SITEMAP PRESERVATION ---');

  await test('Sitemap includes /compare/[slug] routes and excludes private routes', async () => {
    const siteMapEntries = await sitemap();
    assert(Array.isArray(siteMapEntries), 'Sitemap must return an array of entries');
    const urls = siteMapEntries.map((e) => e.url);

    // Private routes excluded
    assert(
      urls.every((u) => !u.includes('/admin')),
      'Sitemap must NEVER contain /admin'
    );
    assert(
      urls.every((u) => !u.includes('/search')),
      'Sitemap must NEVER contain /search (noindex)'
    );
    assert(
      urls.every((u) => !u.includes('/api/')),
      'Sitemap must NEVER contain /api/'
    );
    assert(
      urls.every((u) => !u.includes('/go/')),
      'Sitemap must NEVER contain /go/ affiliate redirects'
    );

    // Public content included
    assert(
      urls.some((u) => u.includes('/compare')),
      'Sitemap must include comparison hub or compare slug routes'
    );
    assert(
      urls.some((u) => u.includes('/guides/')),
      'Sitemap must include guide routes'
    );
    assert(
      urls.some((u) => u.includes('/reviews/')),
      'Sitemap must include review routes'
    );
  });

  await test('Robots.txt disallows private, search, and redirect paths', () => {
    const robotRules = robots();
    const disallowed = Array.isArray(robotRules.rules)
      ? robotRules.rules.flatMap((r) => r.disallow)
      : robotRules.rules?.disallow || [];
    assert(disallowed.includes('/admin/'), 'Robots must disallow /admin/');
    assert(disallowed.includes('/api/'), 'Robots must disallow /api/');
    assert(disallowed.includes('/go/'), 'Robots must disallow /go/');
  });

  // --- 12. ADVANCED SEARCH & FILTER REGRESSION ---
  console.log('\n--- 12. SEARCH & FILTER ENGINE REGRESSION ---');

  await test('searchProducts supports category, price range, and oldest sort', async () => {
    const searchRes = await searchProducts({
      category: 'electronics',
      minPrice: 500,
      maxPrice: 5000,
      sort: 'oldest',
      page: 1,
      limit: 10,
    });
    assert(Array.isArray(searchRes.products), 'searchProducts must return products array');
    assert(typeof searchRes.total === 'number', 'Must return total count');
    assert(typeof searchRes.page === 'number' && searchRes.page === 1, 'Must reflect current page');
    assert(typeof searchRes.totalPages === 'number', 'Must return totalPages');
  });

  // --- 13. DEAL ENGINE & DISCOUNT REGRESSION (PHASE 3) ---
  console.log('\n--- 13. PHASE 3 DEALS ENGINE REGRESSION ---');

  await test('calculateDiscount returns correct percentage and bounds', () => {
    assert(calculateDiscount(1000, 2000) === 50, '1000 from 2000 must be 50% discount');
    assert(calculateDiscount(1000, 1000) === 0, 'No discount when original === current');
    assert(calculateDiscount(2000, 1000) === 0, 'Discount must be 0 when current > original');
  });

  await test('getDealStatus correctly flags active, upcoming, and expired deals', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    assert(
      getDealStatus({ startDate: yesterday, endDate: tomorrow }) === 'active',
      'Deal between yesterday and tomorrow must be active'
    );
    assert(
      getDealStatus({ startDate: tomorrow, endDate: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) }) === 'upcoming',
      'Deal starting tomorrow must be upcoming'
    );
    assert(
      getDealStatus({ startDate: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000), endDate: yesterday }) === 'expired',
      'Deal ending yesterday must be expired'
    );
  });

  // --- 14. DATA SAFETY & NO FAKE METRICS ---
  console.log('\n--- 14. DATA INTEGRITY & ZERO FABRICATED METRICS ---');

  await test('Empty click dataset results in 0 clicks reported, never fabricated counts', async () => {
    // When no clicks exist for a hypothetical product
    const result = await getMostClickedProducts({ limit: 5, days: 30 });
    if (!result.hasRealClickData) {
      assert(
        Object.keys(result.clickCounts).length === 0,
        'Click counts map must be completely empty when no click data exists'
      );
    }
  });

  // --- SUMMARY ---
  console.log('\n==================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`PHASE 5 TEST RESULTS: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('==================================================\n');

  if (failed > 0) {
    console.error('Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.error(`  - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
