import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'onlinesalelive_admin_token';
const AUTH_SECRET =
  process.env.AUTH_SECRET || 'onlinesalelive_super_secure_jwt_secret_key_32chars_min';
const secretKey = new TextEncoder().encode(AUTH_SECRET);

export interface AdminSessionPayload {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

/**
 * Hash a plain password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT token for authenticated admin
 */
export async function signAdminToken(admin: AdminSessionPayload): Promise<string> {
  return new SignJWT({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Verify JWT token string and return session payload
 */
export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (!payload.id || payload.role !== 'admin') {
      return null;
    }
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as 'admin',
    };
  } catch {
    return null;
  }
}

/**
 * Server-side helper to read and verify admin session from HTTP-only cookie
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyAdminToken(token);
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_CONFIG = {
  name: AUTH_COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
};
