import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Admin } from '@/models/Admin';
import { verifyPassword, signAdminToken, AUTH_COOKIE_CONFIG } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: 'Database service is currently unavailable' },
        { status: 503 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail, isActive: true });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(String(password), admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await signAdminToken({
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    response.cookies.set(
      AUTH_COOKIE_CONFIG.name,
      token,
      AUTH_COOKIE_CONFIG.options
    );

    return response;
  } catch (error) {
    console.error('Admin login error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: 'Internal server error occurred during login' },
      { status: 500 }
    );
  }
}
