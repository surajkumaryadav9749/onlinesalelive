import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HeroBanner } from '@/models/HeroBanner';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import {
  validateBannerImageFile,
  saveUploadedBannerFile,
  enforceMaxActiveBanners,
  MAX_ACTIVE_HERO_BANNERS,
} from '@/lib/hero-banners';
import { revalidateHeroBanners } from '@/lib/revalidate';

/**
 * GET /api/admin/hero-banners
 * Returns all banners (active & historical) with active counter metadata.
 */
export async function GET() {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    await connectToDatabase();

    const banners = await HeroBanner.find({}).sort({ displayOrder: 1, createdAt: -1 }).lean();

    const activeCount = banners.filter((b) => b.isActive).length;

    return successResponse({
      banners,
      totalCount: banners.length,
      activeCount,
      maxActive: MAX_ACTIVE_HERO_BANNERS,
      isAtMaxCapacity: activeCount >= MAX_ACTIVE_HERO_BANNERS,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch hero banners';
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/admin/hero-banners
 * Uploads a new banner image or registers image URL.
 * Automatically enforces maximum 5 active banners by deactivating the oldest.
 */
export async function POST(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    await connectToDatabase();

    const contentType = req.headers.get('content-type') || '';
    let title = '';
    let linkUrl = '';
    let imageUrl = '';
    let isActive = true;
    let displayOrder = 0;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      title = (formData.get('title') as string || '').trim();
      linkUrl = (formData.get('linkUrl') as string || '').trim();
      displayOrder = parseInt(formData.get('displayOrder') as string || '0', 10) || 0;

      const activeVal = formData.get('isActive');
      if (activeVal !== null && activeVal !== undefined) {
        isActive = activeVal === 'true' || activeVal === '1';
      }

      const file = formData.get('file');
      if (file && typeof file !== 'string') {
        const fileObj = file as File;
        const validation = validateBannerImageFile(fileObj);
        if (!validation.valid) {
          return errorResponse(validation.error || 'Invalid banner image file', 400);
        }
        imageUrl = await saveUploadedBannerFile(fileObj);
      } else {
        imageUrl = (formData.get('imageUrl') as string || '').trim();
      }
    } else {
      const body = await req.json();
      title = (body.title || '').trim();
      linkUrl = (body.linkUrl || '').trim();
      imageUrl = (body.imageUrl || '').trim();
      displayOrder = typeof body.displayOrder === 'number' ? body.displayOrder : 0;
      if (typeof body.isActive === 'boolean') {
        isActive = body.isActive;
      }
    }

    if (!title) {
      return errorResponse('Banner title is required', 400);
    }

    if (!imageUrl) {
      return errorResponse('Banner image is required (upload an image file or provide an image URL)', 400);
    }

    let deactivatedOldest = false;
    let deactivatedCount = 0;

    // If new banner is active, enforce the max 5 active banners rule
    if (isActive) {
      const result = await enforceMaxActiveBanners(1);
      deactivatedCount = result.deactivatedCount;
      deactivatedOldest = result.deactivatedCount > 0;
    }

    const newBanner = await HeroBanner.create({
      title,
      imageUrl,
      linkUrl,
      isActive,
      displayOrder,
    });

    // Revalidate public homepage hero
    revalidateHeroBanners();

    return successResponse(
      {
        banner: newBanner,
        deactivatedOldest,
        deactivatedCount,
        message: deactivatedOldest
          ? 'Banner uploaded successfully. Oldest active banner was automatically deactivated.'
          : 'Banner uploaded successfully.',
      },
      201
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create hero banner';
    return errorResponse(message, 500);
  }
}
