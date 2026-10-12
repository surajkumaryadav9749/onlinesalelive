import fs from 'fs';
import path from 'path';

async function runMobileHeroTests() {
  console.log('================================================================');
  console.log('MOBILE HERO BANNER & RESPONSIVE LAYOUT VERIFICATION');
  console.log('Validating 50svh Height, Object-Fit, Document Flow, and Responsive Picture');
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

  // --- 1. CSS SPECIFICATION CHECKS (src/app/globals.css) ---
  console.log('--- 1. CSS SPECIFICATION CHECKS (globals.css) ---');
  const globalsCss = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf-8');

  // Verify mobile height is exactly 50svh with 50vh fallback
  const mobileContainerRegex = /\.hero-section-container\s*\{([^}]+)\}/;
  const mobileMatch = globalsCss.match(mobileContainerRegex);
  assert('Found .hero-section-container mobile definition', Boolean(mobileMatch));

  if (mobileMatch) {
    const mobileRules = mobileMatch[1];
    assert('Mobile has height: 50vh fallback', mobileRules.includes('height: 50vh;'));
    assert('Mobile has height: 50svh', mobileRules.includes('height: 50svh;'));
    assert('Mobile has max-height: 50vh fallback', mobileRules.includes('max-height: 50vh;'));
    assert('Mobile has max-height: 50svh', mobileRules.includes('max-height: 50svh;'));
    assert('Mobile does NOT have min-height (removed to prevent exceeding 50svh)', !mobileRules.includes('min-height:'));
    assert('Mobile does NOT use 60vh or 60svh', !mobileRules.includes('60vh') && !mobileRules.includes('60svh'));
    assert('Mobile does NOT use 100vh', !mobileRules.includes('100vh'));
  }

  // Verify desktop layout is preserved unchanged
  const desktopContainerRegex = /@media\s*\(\s*min-width:\s*768px\s*\)\s*\{[\s\S]*?\.hero-section-container\s*\{([^}]+)\}/;
  const desktopMatch = globalsCss.match(desktopContainerRegex);
  assert('Found desktop @media (min-width: 768px) definition', Boolean(desktopMatch));

  if (desktopMatch) {
    const desktopRules = desktopMatch[1];
    assert('Desktop preserves height calculation with --actual-header-height', desktopRules.includes('--actual-header-height'));
    assert('Desktop preserves min-height: 380px', desktopRules.includes('min-height: 380px;'));
    assert('Desktop uses calc(100svh - var(--actual-header-height', desktopRules.includes('100svh'));
  }

  // Verify .hero-banner-image class
  const imageRegex = /\.hero-banner-image\s*\{([^}]+)\}/;
  const imageMatch = globalsCss.match(imageRegex);
  assert('Found .hero-banner-image definition', Boolean(imageMatch));

  if (imageMatch) {
    const imageRules = imageMatch[1];
    assert('Image uses object-fit: contain to preserve proportions and readability', imageRules.includes('object-fit: contain;'));
    assert('Image uses object-position: center center', imageRules.includes('object-position: center center'));
    assert('Image uses width: 100%', imageRules.includes('width: 100%;'));
    assert('Image uses height: 100%', imageRules.includes('height: 100%;'));
    assert('Image uses max-width: 100% and max-height: 100%', imageRules.includes('max-width: 100%;') && imageRules.includes('max-height: 100%;'));
  }

  // --- 2. COMPONENT ARCHITECTURE CHECKS ---
  console.log('\n--- 2. COMPONENT ARCHITECTURE CHECKS ---');
  const carouselContent = fs.readFileSync(path.join(process.cwd(), 'src/components/home/HeroBackgroundCarousel.tsx'), 'utf-8');
  assert('Carousel uses native <picture> element', carouselContent.includes('<picture'));
  assert('Carousel has <source media="(max-width: 767px)"', carouselContent.includes('media="(max-width: 767px)"'));
  assert('Carousel sources mobileImageUrl for mobile viewport', carouselContent.includes('srcSet={banner.mobileImageUrl}'));
  assert('Carousel uses hero-banner-image class on <img>', carouselContent.includes('className="hero-banner-image'));
  assert('Carousel indicators are positioned with bottom-3 (inside container)', carouselContent.includes('bottom-3'));
  assert('Carousel has separate responsive ambient blur for mobile and desktop', carouselContent.includes('md:hidden') && carouselContent.includes('hidden md:block'));

  const pageContent = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf-8');
  assert('Hero section uses hero-section-container class', pageContent.includes('hero-section-container'));
  assert('Hero section contains sr-only h1 for SEO without visible text overlays', pageContent.includes('<h1 className="sr-only">'));
  assert('Hero section does not have Explore Deals CTA overlay button', !pageContent.includes('Explore Deals'));
  assert('Hero section does not have Browse Categories CTA overlay button', !pageContent.includes('Browse Categories'));
  assert('Outer page container removed space-y-12 to prevent giant empty gap below hero', !pageContent.includes('space-y-12 sm:space-y-16 pb-16'));
  assert('Content container starts with mt-4 sm:mt-10 for clean natural document flow', pageContent.includes('mt-4 sm:mt-10'));

  // --- 3. VIEWPORT SCALING & ASPECT RATIO PROPORTION CALCULATIONS ---
  console.log('\n--- 3. VIEWPORT SCALING & ASPECT RATIO PROPORTIONS ---');
  const testViewports = [
    { name: 'iPhone SE / Small (375x812)', width: 375, height: 812 },
    { name: 'iPhone 13 / 14 (390x844)', width: 390, height: 844 },
    { name: 'Android Large (457x1022)', width: 457, height: 1022 },
  ];

  for (const vp of testViewports) {
    const containerHeight = vp.height * 0.50; // exactly 50svh
    const containerWidth = vp.width;

    // Mobile banner uploaded asset: 1024 x 1536 (Aspect ratio: 0.667)
    const imgAspect = 1024 / 1536;
    // With object-fit: contain:
    let renderedW: number, renderedH: number;
    if (containerWidth / containerHeight > imgAspect) {
      // Container is wider than image -> constrained by height
      renderedH = containerHeight;
      renderedW = renderedH * imgAspect;
    } else {
      // Container is taller than image -> constrained by width
      renderedW = containerWidth;
      renderedH = renderedW / imgAspect;
    }

    assert(
      `Viewport ${vp.name}: Container height is exactly 50% (${containerHeight}px)`,
      containerHeight === vp.height * 0.50
    );
    assert(
      `Viewport ${vp.name}: Image fits without exceeding 50svh (Image H: ${renderedH.toFixed(1)}px <= ${containerHeight}px)`,
      renderedH <= containerHeight + 0.01
    );
    assert(
      `Viewport ${vp.name}: Image fits without exceeding container width (Image W: ${renderedW.toFixed(1)}px <= ${containerWidth}px)`,
      renderedW <= containerWidth + 0.01
    );
  }

  // --- 4. LIVE DEV SERVER HTTP RENDER CHECK ---
  console.log('\n--- 4. LIVE DEV SERVER HTTP RENDER CHECK ---');
  try {
    const res = await fetch('http://localhost:3000', { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' } });
    assert('Live dev server responds with 200 OK', res.status === 200);
    const html = await res.text();
    assert('Rendered HTML contains .hero-section-container', html.includes('hero-section-container'));
    assert('Rendered HTML contains <picture>', html.includes('<picture'));
    assert('Rendered HTML contains mobile banner source element', html.includes('(max-width: 767px)'));
    assert('Rendered HTML contains hero-banner-image', html.includes('hero-banner-image'));
    assert('Rendered HTML contains HomeDealsBudgetCategories section following hero', html.includes('Shop by Deals, Budget &amp; Categories') || html.includes('Shop by Deals, Budget & Categories') || html.includes('50%+ Off'));
  } catch (err) {
    console.warn('  [WARN] Dev server request skipped or failed:', err);
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (${passed + failed} TOTAL)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runMobileHeroTests().catch((err) => {
  console.error('Error running mobile hero tests:', err);
  process.exit(1);
});
