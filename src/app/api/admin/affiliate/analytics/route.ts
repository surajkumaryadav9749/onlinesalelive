import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { getAffiliateAnalyticsData } from '@/lib/affiliate-analytics';

export async function GET(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { searchParams } = new URL(req.url);
    const marketplace = searchParams.get('marketplace') || 'Amazon';
    const period = searchParams.get('period') || '30d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const trackingId = searchParams.get('trackingId') || 'all';

    const analytics = await getAffiliateAnalyticsData({
      marketplace,
      period,
      startDate,
      endDate,
      trackingId,
    });

    return successResponse(analytics);
  } catch (err) {
    console.error('Error fetching affiliate analytics:', err instanceof Error ? err.message : err);
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to fetch affiliate analytics',
      500
    );
  }
}
