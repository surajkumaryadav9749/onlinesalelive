import fs from 'fs';
import path from 'path';

interface RouteCheckResult {
  route: string;
  status: number;
  location?: string;
  isRedirect: boolean;
  canonical?: string;
  title?: string;
}

async function verifyRedirectsAndSeo() {
  console.log('================================================================');
  console.log('REDIRECTS & SEO AUDIT VERIFICATION');
  console.log('Testing Target Routes, Status Codes, Canonicals, and Sitemap');
  console.log('================================================================\n');

  const baseUrl = 'http://localhost:3000';
  const expectedCanonicalOrigin = 'https://www.onlinesalelive.in';

  // 1. Direct Routes: Should return 200 OK without redirecting
  const directRoutes = [
    '/',
    '/products',
    '/sale',
    '/discounts',
    '/deals',
    '/todays-deals',
    '/category/clothing',
    '/category/electronics',
    '/category/home-kitchen',
    '/category/shoes',
    '/category/headphones',
  ];

  // 2. Legacy / Redirect Routes: Should return 307/308 redirecting to target
  const redirectRoutes = [
    { from: '/category/fashion', expectedTo: '/category/clothing' },
    { from: '/category/home', expectedTo: '/category/home-kitchen' },
    { from: '/category/footwear', expectedTo: '/category/shoes' },
  ];

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

  console.log('--- 1. DIRECT ROUTES STATUS & CANONICAL CHECK ---');
  for (const route of directRoutes) {
    try {
      const res = await fetch(`${baseUrl}${route}`, {
        redirect: 'manual', // do not follow redirect to check status code
      });

      assert(
        `Route ${route} returns 200 OK directly (no redirect loops)`,
        res.status === 200,
        `Status was ${res.status} (location: ${res.headers.get('location')})`
      );

      if (res.status === 200) {
        const html = await res.text();
        const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
        const canonical = canonicalMatch ? canonicalMatch[1] : null;

        assert(
          `Route ${route} has valid canonical tag`,
          Boolean(canonical),
          'Missing <link rel="canonical">'
        );

        if (canonical) {
          assert(
            `Route ${route} canonical points to ${expectedCanonicalOrigin}`,
            canonical.startsWith(expectedCanonicalOrigin),
            `Canonical was ${canonical}`
          );

          // Path check: root is special, others should contain route
          if (route === '/') {
            assert(
              `Route / canonical is exact base URL`,
              canonical === expectedCanonicalOrigin || canonical === `${expectedCanonicalOrigin}/`,
              `Canonical was ${canonical}`
            );
          } else {
            assert(
              `Route ${route} canonical path matches`,
              canonical.includes(route),
              `Canonical was ${canonical}`
            );
          }
        }
      }
    } catch (err: any) {
      assert(`Route ${route} fetched successfully`, false, err.message);
    }
  }

  console.log('\n--- 2. CONFIGURED REDIRECTS CHECK ---');
  for (const { from, expectedTo } of redirectRoutes) {
    try {
      const res = await fetch(`${baseUrl}${from}`, {
        redirect: 'manual',
      });

      const isRedirectStatus = res.status === 301 || res.status === 307 || res.status === 308;
      assert(
        `Legacy route ${from} returns redirect status (301/308)`,
        isRedirectStatus,
        `Status was ${res.status}`
      );

      const location = res.headers.get('location') || '';
      assert(
        `Legacy route ${from} redirects to ${expectedTo}`,
        location === expectedTo || location.endsWith(expectedTo),
        `Location was ${location}`
      );

      // Verify destination returns 200 OK
      const destUrl = location.startsWith('http') ? location : `${baseUrl}${location}`;
      const destRes = await fetch(destUrl, { redirect: 'manual' });
      assert(
        `Destination ${expectedTo} resolves to 200 OK (no redirect loop)`,
        destRes.status === 200,
        `Destination returned ${destRes.status}`
      );
    } catch (err: any) {
      assert(`Redirect ${from} tested successfully`, false, err.message);
    }
  }

  console.log('\n--- 3. SITEMAP.XML VERIFICATION ---');
  try {
    const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
    assert('Sitemap responds with 200 OK', sitemapRes.status === 200);

    const sitemapXml = await sitemapRes.text();
    assert('Sitemap contains XML structure', sitemapXml.includes('<urlset') && sitemapXml.includes('</urlset>'));

    // Verify all URLs use expectedCanonicalOrigin and not apex or localhost
    const locMatches = sitemapXml.match(/<loc>([^<]+)<\/loc>/g) || [];
    assert(`Sitemap has URLs indexed (${locMatches.length} URLs found)`, locMatches.length > 0);

    let allUseExpectedOrigin = true;
    let anyLegacyFound = false;

    for (const locTag of locMatches) {
      const url = locTag.replace(/<\/?loc>/g, '');
      if (!url.startsWith(expectedCanonicalOrigin)) {
        allUseExpectedOrigin = false;
        console.error(`    Found bad sitemap origin: ${url}`);
      }
      if (
        url.endsWith('/category/fashion') ||
        url.endsWith('/category/home') ||
        url.endsWith('/category/footwear') ||
        url.includes('/category/fashion/') ||
        url.includes('/category/home/') ||
        url.includes('/category/footwear/')
      ) {
        anyLegacyFound = true;
        console.error(`    Found legacy redirecting category in sitemap: ${url}`);
      }
    }

    assert(
      `All ${locMatches.length} sitemap URLs use canonical origin ${expectedCanonicalOrigin}`,
      allUseExpectedOrigin
    );
    assert('Sitemap does NOT include legacy redirecting category URLs', !anyLegacyFound);

    // Verify key pages are in sitemap
    assert('Sitemap contains /products', sitemapXml.includes('/products'));
    assert('Sitemap contains /deals', sitemapXml.includes('/deals'));
    assert('Sitemap contains /sale', sitemapXml.includes('/sale'));
    assert('Sitemap contains /discounts', sitemapXml.includes('/discounts'));
    assert('Sitemap contains /todays-deals', sitemapXml.includes('/todays-deals'));
  } catch (err: any) {
    assert('Sitemap verified successfully', false, err.message);
  }

  console.log('\n--- 4. INTERNAL LINK AUDIT (FOOTER & NAVBAR) ---');
  const footerContent = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/Footer.tsx'), 'utf-8');
  assert('Footer does not link to /category/fashion', !footerContent.includes('/category/fashion'));
  assert('Footer does not link to /category/home"', !footerContent.includes('href="/category/home"'));
  assert('Footer does not link to /category/footwear', !footerContent.includes('/category/footwear'));
  assert('Footer links to /category/clothing', footerContent.includes('/category/clothing'));
  assert('Footer links to /category/home-kitchen', footerContent.includes('/category/home-kitchen'));
  assert('Footer links to /category/headphones', footerContent.includes('/category/headphones'));

  console.log('\n================================================================');
  console.log(`TOTAL AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED (${passed + failed} TOTAL)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifyRedirectsAndSeo().catch((err) => {
  console.error('Audit failed with unexpected error:', err);
  process.exit(1);
});
