import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, searchEntities } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract & sanitize parameters
    const rawQ = searchParams.get('q') || '';
    const q = rawQ.trim().slice(0, 100);

    const category = (searchParams.get('category') || '').trim().toLowerCase().slice(0, 50);
    const marketplace = (searchParams.get('marketplace') || '').trim().slice(0, 30);

    const rawMinPrice = searchParams.get('minPrice');
    const rawMaxPrice = searchParams.get('maxPrice');
    const rawMinDiscount = searchParams.get('minDiscount');
    const rawSort = searchParams.get('sort');
    const rawPage = searchParams.get('page');
    const rawLimit = searchParams.get('limit');

    const minPrice = rawMinPrice !== null && !isNaN(Number(rawMinPrice)) && Number(rawMinPrice) >= 0
      ? Number(rawMinPrice)
      : undefined;

    const maxPrice = rawMaxPrice !== null && !isNaN(Number(rawMaxPrice)) && Number(rawMaxPrice) >= 0
      ? Number(rawMaxPrice)
      : undefined;

    const minDiscount = rawMinDiscount !== null && !isNaN(Number(rawMinDiscount)) && Number(rawMinDiscount) >= 0 && Number(rawMinDiscount) <= 100
      ? Number(rawMinDiscount)
      : undefined;

    // Supported sort keys
    const allowedSorts = [
      'relevance',
      'price_asc',
      'price-asc',
      'price_desc',
      'price-desc',
      'newest',
      'oldest',
      'discount_desc',
      'discount-desc',
      'rating_desc',
      'rating-desc',
    ];
    const sort = rawSort && allowedSorts.includes(rawSort.toLowerCase()) ? rawSort.toLowerCase() : 'relevance';

    // Safe bounds for pagination
    const parsedPage = parseInt(rawPage || '1', 10);
    const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

    const parsedLimit = parseInt(rawLimit || '20', 10);
    const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(50, parsedLimit);

    // Execute queries in parallel
    const [productsResult, entitiesResult] = await Promise.all([
      searchProducts({
        q,
        category: category || undefined,
        marketplace: marketplace || undefined,
        minPrice,
        maxPrice,
        minDiscount,
        sort,
        page,
        limit,
      }),
      q ? searchEntities(q) : Promise.resolve({ categories: [], guides: [], reviews: [], blogPosts: [] }),
    ]);

    return NextResponse.json({
      success: true,
      query: q,
      filters: {
        category: category || null,
        marketplace: marketplace || null,
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
        minDiscount: minDiscount ?? null,
        sort,
      },
      pagination: {
        page: productsResult.page,
        limit: productsResult.limit,
        total: productsResult.total,
        totalPages: productsResult.totalPages,
        hasNext: productsResult.hasNext,
        hasPrev: productsResult.hasPrev,
      },
      products: productsResult.products,
      categories: entitiesResult.categories,
      guides: entitiesResult.guides,
      reviews: entitiesResult.reviews,
      blogPosts: entitiesResult.blogPosts,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while searching products.' },
      { status: 500 }
    );
  }
}
