import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { importAffiliateReport } from '@/lib/affiliate-analytics';
import { MarketplaceName } from '@/types';

export async function POST(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    let csvContent = '';
    let marketplace: MarketplaceName = 'Amazon';
    let trackingId = '';
    let rawReportName = 'Amazon_Associates_Report.csv';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      marketplace = (formData.get('marketplace') as MarketplaceName) || 'Amazon';
      trackingId = (formData.get('trackingId') as string) || '';

      if (!file || typeof file === 'string') {
        return errorResponse('No report file provided');
      }

      const fileObj = file as File;
      rawReportName = fileObj.name || rawReportName;

      if (fileObj.size > 10 * 1024 * 1024) {
        return errorResponse('Report file exceeds maximum allowed limit of 10 MB');
      }

      csvContent = await fileObj.text();
    } else {
      const body = await req.json();
      csvContent = body.csvContent || '';
      marketplace = (body.marketplace as MarketplaceName) || 'Amazon';
      trackingId = body.trackingId || '';
      rawReportName = body.rawReportName || rawReportName;
    }

    if (!csvContent || !csvContent.trim()) {
      return errorResponse('Report content is empty');
    }

    const result = await importAffiliateReport(csvContent, {
      marketplace,
      defaultTrackingId: trackingId || undefined,
      rawReportName,
    });

    if (!result.success && result.errors.length > 0) {
      return errorResponse(result.errors.join('; '), 400);
    }

    return successResponse(result);
  } catch (err) {
    console.error('Error importing affiliate report:', err instanceof Error ? err.message : err);
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to import affiliate report',
      500
    );
  }
}
