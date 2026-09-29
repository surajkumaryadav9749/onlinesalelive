import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { getAffiliateProductPerformance } from '@/lib/affiliate-analytics';

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
    const sortBy = (searchParams.get('sortBy') as 'clicks' | 'sales' | 'earnings' | 'orders') || 'clicks';
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);

    const performance = await getAffiliateProductPerformance({
      marketplace,
      period,
      startDate,
      endDate,
      trackingId,
      sortBy,
      limit,
    });

    return successResponse(performance);
  } catch (err) {
    console.error('Error fetching affiliate product performance:', err instanceof Error ? err.message : err);
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to fetch affiliate product performance',
      500
    );
  }
}
