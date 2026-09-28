import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/api-helpers';
import { generateCsvTemplate } from '@/lib/csv-import';

export async function GET() {
  const { errorResponse } = await checkAdminAuth();
  if (errorResponse) return errorResponse;

  try {
    const csvContent = generateCsvTemplate();

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="products_template.csv"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Error generating CSV template:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSV template' },
      { status: 500 }
    );
  }
}
