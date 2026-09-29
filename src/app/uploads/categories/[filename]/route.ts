import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { connectToDatabase } from '@/lib/db';
import { CategoryImage } from '@/models/CategoryImage';

interface RouteContext {
  params: Promise<{ filename: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { filename } = await context.params;

  if (!filename) {
    return new NextResponse('Image not found', { status: 404 });
  }

  // Sanitize filename to prevent directory traversal
  const safeFilename = path.basename(filename);

  // 1. Try reading from filesystem if file exists (local dev / writable environments)
  try {
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'categories', safeFilename);
    const diskBuffer = await fs.readFile(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
        ? 'image/webp'
        : ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : 'application/octet-stream';

    return new NextResponse(new Uint8Array(diskBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    // If not on disk (e.g. serverless read-only environment on Vercel), fall through to MongoDB
  }

  // 2. Fetch from MongoDB (serverless persistence)
  try {
    await connectToDatabase();
    const imageDoc = await CategoryImage.findOne({ filename: safeFilename }).lean();

    if (!imageDoc || !imageDoc.data) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const buffer = Buffer.isBuffer(imageDoc.data)
      ? imageDoc.data
      : Buffer.from((imageDoc.data as unknown as { buffer: ArrayBuffer }).buffer || imageDoc.data);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': imageDoc.mimeType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: unknown) {
    console.error('[Uploads Route] Error retrieving image from DB:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
