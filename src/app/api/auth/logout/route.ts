import { NextResponse } from 'next/server';
import { AUTH_COOKIE_CONFIG } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set(AUTH_COOKIE_CONFIG.name, '', {
    ...AUTH_COOKIE_CONFIG.options,
    maxAge: 0,
  });

  return response;
}
