import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { getAvailableTrackingIds } from '@/lib/affiliate-analytics';

export async function GET(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { searchParams } = new URL(req.url);
    const marketplace = searchParams.get('marketplace') || 'Amazon';

    const trackingIds = await getAvailableTrackingIds(marketplace);

    return successResponse({ trackingIds });
  } catch (err) {
    console.error('Error fetching tracking IDs:', err instanceof Error ? err.message : err);
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to fetch tracking IDs',
      500
    );
  }
}
