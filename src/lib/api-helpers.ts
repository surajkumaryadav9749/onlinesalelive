import { NextResponse } from 'next/server';
import { getAdminSession, AdminSessionPayload } from '@/lib/auth';
import mongoose from 'mongoose';

export async function checkAdminAuth(): Promise<{
  errorResponse?: NextResponse;
  session?: AdminSessionPayload;
}> {
  const session = await getAdminSession();
  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Admin authentication required' },
        { status: 401 }
      ),
    };
  }
  return { session };
}

export function isValidId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
