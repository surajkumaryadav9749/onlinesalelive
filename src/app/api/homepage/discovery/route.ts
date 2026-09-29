import { NextResponse } from 'next/server';
import { getHomepageDiscoveryData } from '@/lib/data-service';

export const revalidate = 60;

/**
 * Public GET /api/homepage/discovery
 * Returns aggregated discovery data for the 3 homepage sections:
 * - 50%+ Off Categories (categories with active products having discountPercent >= 50)
 * - Budget Tiers (Under ₹299, ₹399, ₹499, ₹599, ₹699, ₹799, ₹899 where products exist)
 * - Shop by Category (all active admin-created categories)
 */
export async function GET() {
  try {
    const data = await getHomepageDiscoveryData();
    return NextResponse.json(
      { success: true, data },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/homepage/discovery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch homepage discovery data' },
      { status: 500 }
    );
  }
}
