import { NextResponse } from 'next/server';
import { getActiveHeroBanners } from '@/lib/data-service';

export const revalidate = 60;

/**
 * Public API to fetch active hero banners (max 5).
 */
export async function GET() {
  try {
    const banners = await getActiveHeroBanners(5);
    return NextResponse.json(
      { success: true, data: banners },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching public hero banners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero banners' },
      { status: 500 }
    );
  }
}
