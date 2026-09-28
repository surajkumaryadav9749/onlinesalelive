import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
process.env.ENABLE_MOCK_FALLBACK = 'true';

import {
  getBaseUrl,
  buildCanonicalUrl,
  serializeJsonLd,
  generateWebSiteSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateProductSchema,
  generateArticleSchema,
  createProductMetadata,
  createCategoryMetadata,
  createPriceRangeMetadata,
} from '../src/lib/seo';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';
import {
  searchProducts,
  searchEntities,
  getProductBySlug,
  getCategoryBySlug,
  getGuideBySlug,
  getReviewBySlug,
  getBlogPostBySlug,
} from '../src/lib/data-service';
import { generateMetadata as generateSearchMetadata } from '../src/app/search/page';
import { Product } from '../src/types';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`  ✓ ${name}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({ name, passed: false, error: errorMsg });
      console.error(`  ✗ ${name}: ${errorMsg}`);
    }
  })();
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runPhase4Tests() {
  console.log('\n==================================================');
  console.log('STARTING PHASE 4 AUTOMATED TEST SUITE');
  console.log('==================================================\n');

  console.log('--- 1. SEO Canonical & Metadata Utilities ---');

  await test('Canonical URL generator builds clean normalized URLs', () => {
    const base = getBaseUrl();
    assert(buildCanonicalUrl('/') === `${base}/`, `Root canonical mismatch: ${buildCanonicalUrl('/')}`);
    assert(buildCanonicalUrl('/product/test-slug') === `${base}/product/test-slug`, 'Path canonical mismatch');
    assert(buildCanonicalUrl('/product/test-slug/') === `${base}/product/test-slug`, 'Trailing slash should be stripped');
    assert(buildCanonicalUrl('category/audio') === `${base}/category/audio`, 'Missing leading slash should be normalized');
  });

  await test('createProductMetadata returns complete metadata object with canonical and OpenGraph', () => {
    const mockProduct: Product = {
      id: 'p1',
      name: 'Sample ANC Wireless Earbuds',
      slug: 'sample-anc-earbuds',
      description: 'High performance active noise cancellation earbuds with 40h battery life.',
      image: 'https://images.unsplash.com/sample.jpg',
      price: 1499,
      originalPrice: 2999,
      discountPercent: 50,
      rating: 4.6,
      reviewCount: 320,
      category: 'Electronics',
      categorySlug: 'electronics',
      pros: ['Good ANC'],
      cons: ['No wireless charging'],
      specifications: {},
      marketplaces: [],
      dealType: "Today's Deal",
    };

    const meta = createProductMetadata(mockProduct);
    assert(Boolean(meta.title?.toString().includes('Sample ANC Wireless Earbuds')), 'Title missing product name');
    assert(Boolean(meta.alternates?.canonical?.toString().includes('/product/sample-anc-earbuds')), 'Canonical mismatch');
    assert(Boolean(meta.openGraph && 'type' in meta.openGraph && meta.openGraph.type === 'website'), 'OpenGraph type mismatch');
    assert(Boolean(meta.twitter && 'card' in meta.twitter && meta.twitter.card === 'summary_large_image'), 'Twitter card mismatch');
  });

  await test('createCategoryMetadata returns complete metadata object with canonical and OpenGraph', () => {
    const mockCat = {
      id: 'c1',
      name: 'Electronics',
      slug: 'electronics',
      icon: 'Cpu',
      description: 'Find top electronics deals across stores.',
      itemCount: 45,
      image: 'https://images.unsplash.com/cat.jpg',
      featured: true,
    };
    const meta = createCategoryMetadata(mockCat);
    assert(Boolean(meta.title?.toString().includes('Electronics')), 'Title missing category name');
    assert(Boolean(meta.alternates?.canonical?.toString().includes('/category/electronics')), 'Canonical mismatch');
    assert(Boolean(meta.openGraph && 'type' in meta.openGraph && meta.openGraph.type === 'website'), 'OpenGraph type mismatch');
  });

  await test('createPriceRangeMetadata creates unique non-generic metadata', () => {
    const meta500 = createPriceRangeMetadata(500, 'Budget Gadgets', 'Top tech under ₹500');
    assert(Boolean(meta500.alternates?.canonical?.toString().endsWith('/products-under-500')), 'Canonical for 500 failed');
    assert(Boolean(meta500.title?.toString().includes('₹500')), 'Title for 500 failed');
  });

  console.log('\n--- 2. Structured Data (JSON-LD) Generation ---');

  await test('generateWebSiteSchema includes schema.org context and valid SearchAction', () => {
    const schema = generateWebSiteSchema();
    assert(schema['@context'] === 'https://schema.org', 'Context mismatch');
    assert(schema['@type'] === 'WebSite', 'Type mismatch');
    assert(schema.potentialAction['@type'] === 'SearchAction', 'SearchAction missing');
    assert(Boolean(schema.potentialAction.target.urlTemplate.includes('/search?q=')), 'SearchAction URL template missing');
  });

  await test('generateOrganizationSchema generates truthful site organization info', () => {
    const schema = generateOrganizationSchema();
    assert(schema['@context'] === 'https://schema.org', 'Context mismatch');
    assert(schema.name === 'OnlineSaleLive', 'Name mismatch');
    assert(Boolean(schema.url), 'Organization URL missing');
  });

  await test('generateBreadcrumbSchema builds sequential BreadcrumbList', () => {
    const items = [
      { label: 'Electronics', href: '/category/electronics' },
      { label: 'Wireless Earbuds', href: '/category/audio' },
      { label: 'boAt Airdopes 141' },
    ];
    const schema = generateBreadcrumbSchema(items);
    assert(schema['@type'] === 'BreadcrumbList', 'Type mismatch');
    assert(schema.itemListElement.length === 4, 'Breadcrumb element count mismatch (Home + 3 items)');
    assert(schema.itemListElement[0].name === 'Home', 'First item must be Home');
    assert(schema.itemListElement[0].position === 1, 'First item position must be 1');
    assert(schema.itemListElement[3].name === 'boAt Airdopes 141', 'Last item name mismatch');
    assert(schema.itemListElement[3].position === 4, 'Last item position must be 4');
  });

  await test('generateProductSchema creates valid Product and accurate Offers', () => {
    const product: Product = {
      id: 'p1',
      name: 'Wireless Earbuds Test',
      slug: 'wireless-earbuds-test',
      description: 'Audio test earbuds',
      image: 'https://images.unsplash.com/test.jpg',
      price: 999,
      originalPrice: 1999,
      discountPercent: 50,
      rating: 4.5,
      reviewCount: 150,
      category: 'Electronics',
      categorySlug: 'electronics',
      pros: [],
      cons: [],
      specifications: {},
      marketplaces: [
        {
          name: 'Amazon',
          price: 999,
          originalPrice: 1999,
          url: 'https://amazon.in/dp/test',
          affiliateUrl: 'https://amazon.in/dp/test?tag=aff',
          isAffiliate: true,
          isActive: true,
          inStock: true,
        },
      ],
      dealType: "Today's Deal",
    };

    const schema = generateProductSchema(product);
    assert(schema['@type'] === 'Product', 'Product type mismatch');
    assert(schema.name === 'Wireless Earbuds Test', 'Product name mismatch');
    assert(Boolean(schema.aggregateRating), 'Aggregate rating missing');
    assert(Boolean(schema.offers), 'Offers missing');
  });

  await test('generateArticleSchema creates valid Article schema for guides and blog posts', () => {
    const schema = generateArticleSchema({
      title: 'Top ANC Earbuds Under 2000',
      description: 'Tested and verified active noise cancellation picks',
      url: 'https://onlinesalelive.in/guides/top-anc-earbuds',
      image: 'https://images.unsplash.com/guide.jpg',
      authorName: 'Editorial Team',
    });
    assert(schema['@type'] === 'Article', 'Article type mismatch');
    assert(schema.headline === 'Top ANC Earbuds Under 2000', 'Headline mismatch');
    assert(schema.author?.name === 'Editorial Team', 'Author mismatch');
  });

  await test('serializeJsonLd prevents script tag injection vulnerabilities', () => {
    const malicious = {
      text: '</script><script>alert("xss")</script>',
    };
    const serialized = serializeJsonLd(malicious);
    assert(!serialized.includes('</script>'), 'Unescaped closing script tag detected');
    assert(serialized.includes('\\u003c/script\\u003e'), 'Script tag not escaped properly');
  });

  console.log('\n--- 3. Robots & Sitemap Discoverability ---');

  await test('robots.ts disallows /admin/, /api/, /go/ and points to sitemap', () => {
    const rules = robots();
    const disallowed = Array.isArray(rules.rules)
      ? rules.rules.flatMap((r) => r.disallow)
      : rules.rules?.disallow || [];

    assert(disallowed.includes('/admin/'), 'Must disallow /admin/');
    assert(disallowed.includes('/api/'), 'Must disallow /api/');
    assert(disallowed.includes('/go/'), 'Must disallow /go/');
    assert(Boolean(rules.sitemap?.toString().endsWith('/sitemap.xml')), 'Sitemap reference missing in robots.ts');
  });

  await test('sitemap.ts strictly excludes /search, /admin, /api, /go and includes real indexable pages', async () => {
    const map = await sitemap();
    const urls = map.map((m) => m.url);

    // Verify exclusions
    assert(!urls.some((u) => u.includes('/search')), 'Sitemap must NOT contain /search');
    assert(!urls.some((u) => u.includes('/admin')), 'Sitemap must NOT contain /admin');
    assert(!urls.some((u) => u.includes('/api/')), 'Sitemap must NOT contain /api');
    assert(!urls.some((u) => u.includes('/go/')), 'Sitemap must NOT contain /go/');

    // Verify inclusions
    const base = getBaseUrl();
    assert(urls.some((u) => u === base || u === `${base}/`), 'Sitemap must contain homepage');
    assert(urls.some((u) => u.includes('/categories')), 'Sitemap must contain /categories');
    assert(urls.some((u) => u.includes('/products')), 'Sitemap must contain /products');
    assert(urls.some((u) => u.includes('/deals')), 'Sitemap must contain /deals');
    assert(urls.some((u) => u.includes('/products-under-500')), 'Sitemap must contain price-range landing pages');
  });

  console.log('\n--- 4. Database Search Engine & Pagination ---');

  await test('searchProducts with empty query returns paginated items without crash', async () => {
    const res = await searchProducts({});
    assert(res.products.length > 0, 'Should return products');
    assert(res.page === 1, 'Default page must be 1');
    assert(res.limit === 20, 'Default limit must be 20');
    assert(res.total >= res.products.length, 'Total must be >= page items count');
  });

  await test('searchProducts matches keyword case-insensitively', async () => {
    const lowerRes = await searchProducts({ q: 'earbuds' });
    const upperRes = await searchProducts({ q: 'EARBUDS' });
    assert(lowerRes.total > 0, 'Keyword earbuds should find products');
    assert(lowerRes.total === upperRes.total, 'Search should be case-insensitive');
  });

  await test('searchProducts filters by category', async () => {
    const res = await searchProducts({ category: 'electronics' });
    assert(res.products.length > 0, 'Electronics category should return products');
    for (const p of res.products) {
      assert(
        p.categorySlug.toLowerCase() === 'electronics' || p.category.toLowerCase() === 'electronics',
        `Product ${p.slug} has wrong category ${p.categorySlug}`
      );
    }
  });

  await test('searchProducts filters by marketplace', async () => {
    const res = await searchProducts({ marketplace: 'Amazon' });
    assert(res.products.length > 0, 'Marketplace Amazon should return products');
    for (const p of res.products) {
      const hasAmazon = p.marketplaces?.some((m) => m.name.toLowerCase() === 'amazon');
      assert(Boolean(hasAmazon), `Product ${p.slug} missing Amazon marketplace`);
    }
  });

  await test('searchProducts filters by price range (minPrice, maxPrice)', async () => {
    const res = await searchProducts({ minPrice: 500, maxPrice: 1500 });
    for (const p of res.products) {
      assert(p.price >= 500 && p.price <= 1500, `Product price ${p.price} out of range [500, 1500]`);
    }
  });

  await test('searchProducts filters by discount percent (minDiscount)', async () => {
    const res = await searchProducts({ minDiscount: 40 });
    for (const p of res.products) {
      assert(p.discountPercent >= 40, `Product discount ${p.discountPercent} < 40%`);
    }
  });

  await test('searchProducts sorts deterministically by price_asc and price_desc', async () => {
    const ascRes = await searchProducts({ sort: 'price_asc' });
    for (let i = 0; i < ascRes.products.length - 1; i++) {
      assert(
        ascRes.products[i].price <= ascRes.products[i + 1].price,
        `price_asc violation: ${ascRes.products[i].price} > ${ascRes.products[i + 1].price}`
      );
    }

    const descRes = await searchProducts({ sort: 'price_desc' });
    for (let i = 0; i < descRes.products.length - 1; i++) {
      assert(
        descRes.products[i].price >= descRes.products[i + 1].price,
        `price_desc violation: ${descRes.products[i].price} < ${descRes.products[i + 1].price}`
      );
    }
  });

  await test('searchProducts sorts deterministically by discount_desc', async () => {
    const res = await searchProducts({ sort: 'discount_desc' });
    assert(res.products.length > 0, 'discount_desc should return products');
    for (let i = 0; i < res.products.length - 1; i++) {
      assert(
        res.products[i].discountPercent >= res.products[i + 1].discountPercent,
        `discount_desc violation: ${res.products[i].discountPercent} < ${res.products[i + 1].discountPercent}`
      );
    }
  });

  await test('searchProducts sorts deterministically by oldest (createdAt ascending with stable secondary sort)', async () => {
    const oldestRes = await searchProducts({ sort: 'oldest', limit: 20 });
    assert(oldestRes.products.length > 0, 'oldest sort should return products');

    // If createdAt is populated on returned products, assert chronological ascending order
    for (let i = 0; i < oldestRes.products.length - 1; i++) {
      const cur = oldestRes.products[i].createdAt ? new Date(oldestRes.products[i].createdAt!).getTime() : null;
      const next = oldestRes.products[i + 1].createdAt ? new Date(oldestRes.products[i + 1].createdAt!).getTime() : null;
      if (cur !== null && next !== null) {
        assert(
          cur <= next,
          `oldest sort violation: createdAt ${oldestRes.products[i].createdAt} > ${oldestRes.products[i + 1].createdAt}`
        );
      }
    }

    // Verify pagination and metadata are preserved when sorting by oldest
    assert(oldestRes.page === 1, 'Default page must be 1');
    assert(oldestRes.limit === 20, 'Limit must be 20');
    assert(oldestRes.total >= oldestRes.products.length, 'Total must be >= products length');
  });

  await test('searchProducts validates sort parameter safely and falls back to default relevance on unsupported values', async () => {
    const invalidSortRes = await searchProducts({ sort: 'unsupported_sort_key_xyz' });
    const defaultRes = await searchProducts({});
    assert(invalidSortRes.products.length > 0, 'Unsupported sort should return products');
    assert(invalidSortRes.total === defaultRes.total, 'Unsupported sort should match default result count');
  });

  await test('searchProducts combines sorting with filters and pagination correctly', async () => {
    const res = await searchProducts({
      category: 'electronics',
      sort: 'oldest',
      page: 1,
      limit: 5,
    });
    assert(res.products.length <= 5, 'Limit 5 must be respected');
    assert(res.page === 1, 'Page 1 must be respected');
    for (const p of res.products) {
      assert(
        p.categorySlug.toLowerCase() === 'electronics' || p.category.toLowerCase() === 'electronics',
        `Product ${p.slug} must match category filter`
      );
    }
  });

  await test('searchProducts handles invalid numbers, negative pages, and excessive limits safely', async () => {
    const res = await searchProducts({
      page: -5,
      limit: 5000,
      minPrice: -100,
    });
    assert(res.page === 1, 'Negative page must be clamped to 1');
    assert(res.limit <= 50, 'Excessive limit must be clamped to <= 50');
  });

  await test('searchProducts safely escapes special regex characters without crashing', async () => {
    const res = await searchProducts({ q: '([test+*?^$])' });
    assert(typeof res.total === 'number', 'Regex query must not crash');
  });

  await test('searchEntities finds matching categories, guides, reviews, and blog posts', async () => {
    const entities = await searchEntities('earbuds');
    assert(Array.isArray(entities.categories), 'categories must be array');
    assert(Array.isArray(entities.guides), 'guides must be array');
    assert(Array.isArray(entities.reviews), 'reviews must be array');
    assert(Array.isArray(entities.blogPosts), 'blogPosts must be array');
  });

  console.log('\n--- 5. Search Result SEO & 404 Safety ---');

  await test('search page generateMetadata enforces noindex, follow to prevent indexing arbitrary query variants', async () => {
    const meta = await generateSearchMetadata({ searchParams: Promise.resolve({ q: 'random-query' }) });
    const robotsVal = meta.robots;
    assert(Boolean(robotsVal && typeof robotsVal === 'object' && 'index' in robotsVal && robotsVal.index === false), 'Search must have robots index: false');
    assert(Boolean(robotsVal && typeof robotsVal === 'object' && 'follow' in robotsVal && robotsVal.follow === true), 'Search must have robots follow: true');
  });

  await test('detail lookups for nonexistent slugs return undefined to trigger strict Next.js notFound()', async () => {
    const fakeProduct = await getProductBySlug('nonexistent-product-slug-12345');
    assert(fakeProduct === undefined, 'Nonexistent product slug must return undefined');

    const fakeCategory = await getCategoryBySlug('nonexistent-category-slug-12345');
    assert(fakeCategory === undefined, 'Nonexistent category slug must return undefined');

    const fakeGuide = await getGuideBySlug('nonexistent-guide-slug-12345');
    assert(fakeGuide === undefined, 'Nonexistent guide slug must return undefined');

    const fakeReview = await getReviewBySlug('nonexistent-review-slug-12345');
    assert(fakeReview === undefined, 'Nonexistent review slug must return undefined');

    const fakeBlogPost = await getBlogPostBySlug('nonexistent-blog-slug-12345');
    assert(fakeBlogPost === undefined, 'Nonexistent blog slug must return undefined');
  });

  console.log('\n==================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`PHASE 4 TEST SUMMARY: ${passed} passed, ${failed} failed (${results.length} total)`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Fatal error running Phase 4 tests:', err);
  process.exit(1);
});
