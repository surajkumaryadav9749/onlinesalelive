import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { checkAdminAuth } from '@/lib/api-helpers';
import { exportProductsToCsv } from '@/lib/csv-import';

export async function GET() {
  const { errorResponse } = await checkAdminAuth();
  if (errorResponse) return errorResponse;

  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const csvContent = await exportProductsToCsv();
    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="onlinesalelive_products_${dateStr}.csv"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Error exporting products to CSV:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to export products' },
      { status: 500 }
    );
  }
}
