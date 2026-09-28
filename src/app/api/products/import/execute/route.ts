import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import {
  parseCsvString,
  validateCsvRows,
  executeCsvImport,
  MAX_CSV_FILE_SIZE,
  MAX_IMPORT_ROWS,
  RawCsvRow,
} from '@/lib/csv-import';

export async function POST(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    let csvContent = '';
    let updateExisting = false;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      updateExisting = formData.get('updateExisting') === 'true';

      if (!file || typeof file === 'string') {
        return errorResponse('No CSV file provided in upload');
      }

      const fileObj = file as File;

      if (fileObj.size > MAX_CSV_FILE_SIZE) {
        return errorResponse('File size exceeds maximum allowed limit of 5 MB');
      }

      csvContent = await fileObj.text();
    } else {
      const body = await req.json();
      csvContent = body.csvContent || '';
      updateExisting = Boolean(body.updateExisting);
    }

    if (!csvContent || !csvContent.trim()) {
      return errorResponse('CSV content is empty');
    }

    const { rows, error: parseError } = parseCsvString(csvContent);
    if (parseError) {
      return errorResponse(parseError);
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return errorResponse(`CSV exceeds limit of ${MAX_IMPORT_ROWS} rows`);
    }

    // Re-validate strictly on server
    const validationSummary = await validateCsvRows(rows as RawCsvRow[], { updateExisting });

    // Execute writes
    const importResult = await executeCsvImport(validationSummary.rows, { updateExisting });

    return successResponse(importResult);
  } catch (err) {
    console.error('Error executing CSV import:', err instanceof Error ? err.message : err);
    return errorResponse(
      err instanceof Error ? err.message : 'An error occurred during product import execution',
      500
    );
  }
}
