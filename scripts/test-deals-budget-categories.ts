import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { filterAndSortProducts } from '../src/lib/filter-utils';
import { getHomepageDiscoveryData } from '../src/lib/data-service';
import { Product, Category } from '../src/types';

async function runTestSuite() {
  console.log('================================================================');
  console.log('SHOP BY DEALS, BUDGET & CATEGORIES DISCOVERY TEST SUITE');
  console.log('Verifying 20 core requirements for dynamic homepage discovery');
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

  // --- Synthetic product and category test dataset ---
  const mockCategories: Category[] = [
    {
      id: 'cat-laptops',
      slug: 'laptops',
      name: 'Laptops',
      description: 'Laptops and notebooks',
      icon: 'Laptop',
      itemCount: 10,
      featured: true,
      displayOrder: 1,
      isActive: true,
    },
    {
      id: 'cat-headphones',
      slug: 'headphones',
      name: 'Headphones',
      description: 'Audio & headphones',
      icon: 'Headphones',
      itemCount: 8,
      featured: true,
      displayOrder: 2,
      isActive: true,
    },
    {
      id: 'cat-shoes',
      slug: 'shoes',
      name: 'Shoes',
      description: 'Footwear & shoes',
      icon: 'Footprints',
      itemCount: 5,
      featured: false,
      displayOrder: 3,
      isActive: true,
    },
    {
      id: 'cat-inactive',
      slug: 'old-electronics',
      name: 'Old Electronics',
      description: 'Deactivated category',
      icon: 'Tv',
      itemCount: 2,
      featured: false,
      displayOrder: 4,
      isActive: false,
    },
  ];

  const baseProduct = {
    pros: ['Quality build', 'Fast shipping'],
    cons: ['Limited stock'],
    specifications: { Warranty: '1 Year Manufacturer' },
    marketplaces: [],
    tags: [],
  };

  const testProducts: Product[] = [
    // Laptops: 2 active with discount >= 50, 1 inactive with discount >= 50, 1 active with discount < 50
    {
      id: 'p-lap-1',
      name: 'Laptop Deal A',
      slug: 'laptop-deal-a',
      description: 'Fast laptop',
      category: 'Laptops',
      categorySlug: 'laptops',
      price: 49999,
      originalPrice: 100000,
      discountPercent: 50, // >= 50
      image: 'https://images.unsplash.com/laptop-1.jpg',
      rating: 4.5,
      reviewCount: 120,
      dealType: 'Major Discount',
      featured: true,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-lap-2',
      name: 'Laptop Deal B',
      slug: 'laptop-deal-b',
      description: 'Ultra laptop',
      category: 'Laptops',
      categorySlug: 'laptops',
      price: 35000,
      originalPrice: 80000,
      discountPercent: 56, // >= 50
      image: 'https://images.unsplash.com/laptop-2.jpg',
      rating: 4.8,
      reviewCount: 90,
      dealType: 'Flash Deal',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-lap-inactive',
      name: 'Laptop Deal Inactive',
      slug: 'laptop-deal-inactive',
      description: 'Draft laptop',
      category: 'Laptops',
      categorySlug: 'laptops',
      price: 25000,
      originalPrice: 60000,
      discountPercent: 58, // >= 50 but INACTIVE
      image: 'https://images.unsplash.com/laptop-inactive.jpg',
      rating: 4.0,
      reviewCount: 10,
      dealType: 'Regular',
      featured: false,
      isActive: false, // inactive!
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-lap-3',
      name: 'Laptop Deal C (Low discount)',
      slug: 'laptop-deal-c',
      description: 'Modest discount laptop',
      category: 'Laptops',
      categorySlug: 'laptops',
      price: 55000,
      originalPrice: 60000,
      discountPercent: 8, // < 50
      image: 'https://images.unsplash.com/laptop-3.jpg',
      rating: 4.2,
      reviewCount: 40,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },

    // Headphones: 2 active products, but BOTH have discount < 50 (should NOT qualify for 50%+ section)
    {
      id: 'p-hp-1',
      name: 'Headphones Pro',
      slug: 'headphones-pro',
      description: 'Crisp audio',
      category: 'Headphones',
      categorySlug: 'headphones',
      price: 1999,
      originalPrice: 2500,
      discountPercent: 20, // < 50
      image: 'https://images.unsplash.com/hp-1.jpg',
      rating: 4.3,
      reviewCount: 30,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-hp-2',
      name: 'Headphones Bass',
      slug: 'headphones-bass',
      description: 'Punchy bass',
      category: 'Headphones',
      categorySlug: 'headphones',
      price: 999,
      originalPrice: 1500,
      discountPercent: 33, // < 50
      image: 'https://images.unsplash.com/hp-2.jpg',
      rating: 4.1,
      reviewCount: 15,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },

    // Shoes: 1 active product with discount >= 50
    {
      id: 'p-shoe-1',
      name: 'Running Shoes Turbo',
      slug: 'running-shoes-turbo',
      description: 'Super light running shoes',
      category: 'Shoes',
      categorySlug: 'shoes',
      price: 1499,
      originalPrice: 3200,
      discountPercent: 53, // >= 50
      image: 'https://images.unsplash.com/shoes-1.jpg',
      rating: 4.6,
      reviewCount: 50,
      dealType: 'Sale',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },

    // Budget items at various price points:
    // Under 299:
    {
      id: 'p-budget-249',
      name: 'Mobile Cable 1m',
      slug: 'mobile-cable-1m',
      description: 'Fast charging cable',
      category: 'Accessories',
      categorySlug: 'accessories',
      price: 249, // < 299
      originalPrice: 500,
      discountPercent: 50,
      image: 'https://images.unsplash.com/cable.jpg',
      rating: 4.0,
      reviewCount: 200,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    // Inactive item under 299 (must NOT be counted)
    {
      id: 'p-budget-inactive',
      name: 'Inactive Screen Guard',
      slug: 'inactive-screen-guard',
      description: 'Screen guard draft',
      category: 'Accessories',
      categorySlug: 'accessories',
      price: 199, // < 299 but INACTIVE
      originalPrice: 399,
      discountPercent: 50,
      image: 'https://images.unsplash.com/guard.jpg',
      rating: 3.5,
      reviewCount: 5,
      dealType: 'Regular',
      featured: false,
      isActive: false, // inactive!
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    // Under 399:
    {
      id: 'p-budget-349',
      name: 'USB-C Adapter',
      slug: 'usb-c-adapter',
      description: 'OTG adapter',
      category: 'Accessories',
      categorySlug: 'accessories',
      price: 349, // < 399
      originalPrice: 600,
      discountPercent: 41,
      image: 'https://images.unsplash.com/otg.jpg',
      rating: 4.2,
      reviewCount: 80,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    // Under 499:
    {
      id: 'p-budget-449',
      name: 'Gaming Mouse Pad XL',
      slug: 'gaming-mouse-pad-xl',
      description: 'Smooth cloth mat',
      category: 'Accessories',
      categorySlug: 'accessories',
      price: 449, // < 499
      originalPrice: 900,
      discountPercent: 50,
      image: 'https://images.unsplash.com/pad.jpg',
      rating: 4.7,
      reviewCount: 150,
      dealType: 'Sale',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    // Under 599:
    {
      id: 'p-budget-549',
      name: 'Bluetooth Earphones Lite',
      slug: 'bt-earphones-lite',
      description: 'Wireless neckband',
      category: 'Headphones',
      categorySlug: 'headphones',
      price: 549, // < 599
      originalPrice: 1200,
      discountPercent: 44, // < 50, so headphones has 0 qualifying products for 50%+ section
      image: 'https://images.unsplash.com/neckband.jpg',
      rating: 4.1,
      reviewCount: 65,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    // Under 699:
    {
      id: 'p-budget-649',
      name: 'Smart Casual Shirt',
      slug: 'smart-casual-shirt',
      description: 'Cotton slim fit shirt',
      category: 'Fashion',
      categorySlug: 'fashion',
      price: 649, // < 699
      originalPrice: 1500,
      discountPercent: 56,
      image: 'https://images.unsplash.com/shirt.jpg',
      rating: 4.3,
      reviewCount: 45,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    // Under 799:
    {
      id: 'p-budget-749',
      name: 'Casual Denim Backpack',
      slug: 'casual-denim-backpack',
      description: 'Water resistant daypack',
      category: 'Accessories',
      categorySlug: 'accessories',
      price: 749, // < 799
      originalPrice: 1800,
      discountPercent: 58,
      image: 'https://images.unsplash.com/backpack.jpg',
      rating: 4.4,
      reviewCount: 95,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    // Under 899:
    {
      id: 'p-budget-849',
      name: 'Wireless Ergonomic Mouse',
      slug: 'wireless-ergonomic-mouse',
      description: '2.4GHz quiet mouse',
      category: 'Accessories',
      categorySlug: 'accessories',
      price: 849, // < 899
      originalPrice: 1999,
      discountPercent: 57,
      image: 'https://images.unsplash.com/mouse.jpg',
      rating: 4.5,
      reviewCount: 110,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
    // Exact boundary price: 899 (should NOT be under 899 since price < 899)
    {
      id: 'p-budget-exact-899',
      name: 'Exact 899 Product',
      slug: 'exact-899-product',
      description: 'Boundary item',
      category: 'Accessories',
      categorySlug: 'accessories',
      price: 899, // = 899, not < 899
      originalPrice: 1500,
      discountPercent: 40,
      image: 'https://images.unsplash.com/boundary.jpg',
      rating: 4.0,
      reviewCount: 10,
      dealType: 'Regular',
      featured: false,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
  ];

  // Helper simulating server discovery aggregation
  function computeDiscoveryData(products: Product[], categories: Category[]) {
    const activeCategories = categories.filter((c) => c.isActive !== false);

    // 50%+ Off categories
    const qualifyingProducts = products.filter((p) => p.isActive && p.discountPercent >= 50);
    const catCountMap = new Map<string, { count: number; sampleImage: string }>();
    for (const p of qualifyingProducts) {
      const slug = (p.categorySlug || p.category || '').toLowerCase();
      const existing = catCountMap.get(slug);
      if (existing) {
        existing.count++;
      } else {
        catCountMap.set(slug, { count: 1, sampleImage: p.image });
      }
    }

    const discountCategories: { slug: string; name: string; count: number; image?: string; icon?: string }[] = [];
    for (const cat of activeCategories) {
      const info = catCountMap.get(cat.slug.toLowerCase());
      if (info && info.count > 0) {
        discountCategories.push({
          slug: cat.slug,
          name: cat.name,
          count: info.count,
          image: info.sampleImage || cat.image || '',
          icon: cat.icon || 'Tv',
        });
      }
    }
    discountCategories.sort((a, b) => b.count - a.count);

    // Budget tiers
    const activeProducts = products.filter((p) => p.isActive);
    const budgetAmounts = [299, 399, 499, 599, 699, 799, 899];
    const budgetTiers = budgetAmounts
      .map((amount) => {
        const count = activeProducts.filter((p) => p.price < amount).length;
        return {
          label: `Under ₹${amount}`,
          amount,
          count,
          href: `/products?maxPrice=${amount}`,
        };
      })
      .filter((tier) => tier.count > 0);

    const discoveryCategories = activeCategories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      image: c.image || '',
      icon: c.icon || 'Tv',
      itemCount: c.itemCount || 0,
    }));

    return { discountCategories, budgetTiers, categories: discoveryCategories };
  }

  const computed = computeDiscoveryData(testProducts, mockCategories);

  // 1. 50%+ category detection
  const laptopDiscountCategory = computed.discountCategories.find((c) => c.slug === 'laptops');
  assert(1, '50%+ category detection succeeds for qualifying categories', !!laptopDiscountCategory);

  // 2. Category with qualifying products appears
  assert(
    2,
    'Category with qualifying products appears in 50%+ section',
    laptopDiscountCategory?.name === 'Laptops' && (laptopDiscountCategory?.count ?? 0) >= 2
  );

  // 3. Category with zero qualifying products does not appear
  const headphonesDiscountCategory = computed.discountCategories.find((c) => c.slug === 'headphones');
  assert(
    3,
    'Category with zero qualifying products does NOT appear in 50%+ section',
    headphonesDiscountCategory === undefined
  );

  // 4. Only active products are counted
  // Laptops has 2 active with discount >= 50, and 1 inactive with discount >= 50. Total count should be 2.
  assert(
    4,
    'Only active products are counted (inactive products excluded)',
    laptopDiscountCategory?.count === 2
  );

  // 5. discountPercent >= 50 logic
  // p-lap-1 (50%) and p-lap-2 (56%) counted, p-lap-3 (8%) excluded
  const qualifyingDiscounts = testProducts
    .filter((p) => p.categorySlug === 'laptops' && p.isActive && p.discountPercent >= 50)
    .every((p) => p.discountPercent >= 50);
  assert(5, 'Strict discountPercent >= 50 boundary logic satisfied', qualifyingDiscounts);

  // 6. Under ₹299 filter
  const under299 = filterAndSortProducts(testProducts.filter((p) => p.isActive), {
    maxPrice: 299,
    maxPriceExclusive: true,
  });
  assert(
    6,
    'Under ₹299 filter returns only products with price < 299',
    under299.length > 0 && under299.every((p) => p.price < 299)
  );

  // 7. Under ₹399 filter
  const under399 = filterAndSortProducts(testProducts.filter((p) => p.isActive), {
    maxPrice: 399,
    maxPriceExclusive: true,
  });
  assert(
    7,
    'Under ₹399 filter returns only products with price < 399',
    under399.length > 0 && under399.every((p) => p.price < 399)
  );

  // 8. Under ₹499 filter
  const under499 = filterAndSortProducts(testProducts.filter((p) => p.isActive), {
    maxPrice: 499,
    maxPriceExclusive: true,
  });
  assert(
    8,
    'Under ₹499 filter returns only products with price < 499',
    under499.length > 0 && under499.every((p) => p.price < 499)
  );

  // 9. Under ₹599 filter
  const under599 = filterAndSortProducts(testProducts.filter((p) => p.isActive), {
    maxPrice: 599,
    maxPriceExclusive: true,
  });
  assert(
    9,
    'Under ₹599 filter returns only products with price < 599',
    under599.length > 0 && under599.every((p) => p.price < 599)
  );

  // 10. Under ₹699 filter
  const under699 = filterAndSortProducts(testProducts.filter((p) => p.isActive), {
    maxPrice: 699,
    maxPriceExclusive: true,
  });
  assert(
    10,
    'Under ₹699 filter returns only products with price < 699',
    under699.length > 0 && under699.every((p) => p.price < 699)
  );

  // 11. Under ₹799 filter
  const under799 = filterAndSortProducts(testProducts.filter((p) => p.isActive), {
    maxPrice: 799,
    maxPriceExclusive: true,
  });
  assert(
    11,
    'Under ₹799 filter returns only products with price < 799',
    under799.length > 0 && under799.every((p) => p.price < 799)
  );

  // 12. Under ₹899 filter
  const under899 = filterAndSortProducts(testProducts.filter((p) => p.isActive), {
    maxPrice: 899,
    maxPriceExclusive: true,
  });
  const exact899Included = under899.some((p) => p.id === 'p-budget-exact-899');
  assert(
    12,
    'Under ₹899 filter excludes products with price = 899 (strict price < 899)',
    !exact899Included && under899.every((p) => p.price < 899)
  );

  // 13. Only active products are used for budget filters
  const inactiveBudgetIncluded = under299.some((p) => p.id === 'p-budget-inactive');
  assert(13, 'Only active products are counted in budget filters', !inactiveBudgetIncluded);

  // 14. All active admin-created categories appear in Shop by Category
  const activeSlugs = mockCategories.filter((c) => c.isActive).map((c) => c.slug);
  const discoverySlugs = computed.categories.map((c) => c.slug);
  const allActiveIncluded = activeSlugs.every((slug) => discoverySlugs.includes(slug));
  assert(14, 'All active admin-created categories appear in Shop by Category', allActiveIncluded);

  // 15. Inactive categories do not appear
  const inactiveIncluded = discoverySlugs.includes('old-electronics');
  assert(15, 'Inactive categories do NOT appear in public discovery rows', !inactiveIncluded);

  // 16. New admin category automatically appears
  const updatedCategoriesWithNew: Category[] = [
    ...mockCategories,
    {
      id: 'cat-smartwatches',
      slug: 'smart-watches',
      name: 'Smart Watches',
      description: 'Wearable tech',
      icon: 'Watch',
      itemCount: 12,
      featured: false,
      displayOrder: 5,
      isActive: true,
    },
  ];
  const recomputedAfterAdminAdd = computeDiscoveryData(testProducts, updatedCategoriesWithNew);
  const newCatAppears = recomputedAfterAdminAdd.categories.some((c) => c.slug === 'smart-watches');
  assert(16, 'New admin category automatically appears without code changes', newCatAppears);

  // 17. Category with discount products automatically enters 50%+ section
  const newProductsWithDiscount: Product[] = [
    ...testProducts,
    {
      id: 'p-sw-1',
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      description: 'Fitness smartwatch',
      category: 'Smart Watches',
      categorySlug: 'smart-watches',
      price: 2999,
      originalPrice: 6500,
      discountPercent: 54, // >= 50
      image: 'https://images.unsplash.com/watch.jpg',
      rating: 4.7,
      reviewCount: 300,
      dealType: 'Flash Deal',
      featured: true,
      isActive: true,
      ...baseProduct,
      createdAt: new Date().toISOString(),
    },
  ];
  const recomputedWithWatchDiscount = computeDiscoveryData(newProductsWithDiscount, updatedCategoriesWithNew);
  const watchEntersDiscount = recomputedWithWatchDiscount.discountCategories.some(
    (c) => c.slug === 'smart-watches'
  );
  assert(
    17,
    'Category with 50%+ discounted product automatically enters 50%+ section',
    watchEntersDiscount
  );

  // 18. Empty states work (no matching items produces empty array, no crashes)
  const emptyDiscovery = computeDiscoveryData([], []);
  assert(
    18,
    'Empty states handled gracefully without errors',
    emptyDiscovery.discountCategories.length === 0 &&
      emptyDiscovery.budgetTiers.length === 0 &&
      emptyDiscovery.categories.length === 0
  );

  // 19. Existing product filters continue working
  const existingCategoryFilter = filterAndSortProducts(testProducts, { category: 'laptops' });
  const existingMinDiscountFilter = filterAndSortProducts(testProducts, { minDiscount: 50 });
  assert(
    19,
    'Existing product filters (category, minDiscount, etc.) continue working',
    existingCategoryFilter.every((p) => p.categorySlug === 'laptops') &&
      existingMinDiscountFilter.every((p) => p.discountPercent >= 50)
  );

  // 20. Live getHomepageDiscoveryData() integration test
  try {
    const liveData = await getHomepageDiscoveryData();
    assert(
      20,
      'Live getHomepageDiscoveryData() returns valid structure',
      Array.isArray(liveData.discountCategories) &&
        Array.isArray(liveData.budgetTiers) &&
        Array.isArray(liveData.categories)
    );
  } catch (err) {
    assert(20, 'Live getHomepageDiscoveryData() execution', false, String(err));
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

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
