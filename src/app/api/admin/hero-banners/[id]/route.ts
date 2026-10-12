import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HeroBanner } from '@/models/HeroBanner';
import { checkAdminAuth, errorResponse, successResponse, isValidId } from '@/lib/api-helpers';
import {
  enforceMaxActiveBanners,
  deleteUploadedBannerFile,
  validateBannerImageFile,
  saveUploadedBannerFile,
} from '@/lib/hero-banners';
import { revalidateHeroBanners } from '@/lib/revalidate';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/hero-banners/[id]
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  const { id } = await context.params;
  if (!isValidId(id)) {
    return errorResponse('Invalid banner ID', 400);
  }

  try {
    await connectToDatabase();
    const banner = await HeroBanner.findById(id).lean();
    if (!banner) {
      return errorResponse('Hero banner not found', 404);
    }
    return successResponse(banner);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch banner';
    return errorResponse(message, 500);
  }
}

/**
 * PATCH /api/admin/hero-banners/[id]
 * Updates banner details, replaces image file/URL, or toggles active status.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  const { id } = await context.params;
  if (!isValidId(id)) {
    return errorResponse('Invalid banner ID', 400);
  }

  try {
    await connectToDatabase();
    const existing = await HeroBanner.findById(id);
    if (!existing) {
      return errorResponse('Hero banner not found', 404);
    }

    const contentType = (req.headers.get('content-type') || '').toLowerCase();
    let title: string | undefined;
    let linkUrl: string | undefined;
    let imageUrl: string | undefined;
    let isActive: boolean | undefined;
    let displayOrder: number | undefined;
    let replacementFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      const rawTitle = formData.get('title');
      if (typeof rawTitle === 'string') title = rawTitle.trim();

      const rawLink = formData.get('linkUrl');
      if (typeof rawLink === 'string') linkUrl = rawLink.trim();

      const rawOrder = formData.get('displayOrder');
      if (rawOrder !== null && rawOrder !== undefined) {
        displayOrder = parseInt(String(rawOrder), 10) || 0;
      }

      const rawActive = formData.get('isActive');
      if (rawActive !== null && rawActive !== undefined) {
        isActive = rawActive === 'true' || rawActive === '1';
      }

      const rawImageUrl = formData.get('imageUrl');
      if (typeof rawImageUrl === 'string' && rawImageUrl.trim()) {
        imageUrl = rawImageUrl.trim();
      }

      const fileEntry = formData.get('file') ?? formData.get('image');
      if (fileEntry && typeof fileEntry !== 'string' && fileEntry.size > 0) {
        replacementFile = fileEntry as File;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.title !== undefined) title = String(body.title).trim();
      if (body.linkUrl !== undefined) linkUrl = String(body.linkUrl).trim();
      if (body.imageUrl !== undefined) imageUrl = String(body.imageUrl).trim();
      if (body.isActive !== undefined) isActive = Boolean(body.isActive);
      if (body.displayOrder !== undefined) displayOrder = Number(body.displayOrder) || 0;
    }

    const oldImageUrl = existing.imageUrl || '';

    // Handle image file upload replacement
    if (replacementFile) {
      const validation = validateBannerImageFile(replacementFile);
      if (!validation.valid) {
        return errorResponse(validation.error || 'Invalid banner image file', 400);
      }

      const newImageUrl = await saveUploadedBannerFile(replacementFile);
      if (oldImageUrl && oldImageUrl !== newImageUrl) {
        await deleteUploadedBannerFile(oldImageUrl, id);
      }
      existing.imageUrl = newImageUrl;
    } else if (imageUrl !== undefined && imageUrl !== '') {
      if (oldImageUrl && oldImageUrl !== imageUrl) {
        await deleteUploadedBannerFile(oldImageUrl, id);
      }
      existing.imageUrl = imageUrl;
    }

    let deactivatedOldest = false;

    // If activating an inactive banner, enforce max 5 active banners
    if (isActive === true && !existing.isActive) {
      const result = await enforceMaxActiveBanners(1, id);
      deactivatedOldest = result.deactivatedCount > 0;
    }

    if (title !== undefined && title.length > 0) existing.title = title;
    if (linkUrl !== undefined) existing.linkUrl = linkUrl;
    if (isActive !== undefined) existing.isActive = isActive;
    if (displayOrder !== undefined) existing.displayOrder = displayOrder;

    await existing.save();

    revalidateHeroBanners();

    return successResponse({
      banner: existing,
      deactivatedOldest,
      message: deactivatedOldest
        ? 'Banner updated and activated. Oldest active banner was automatically deactivated.'
        : 'Banner updated successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update hero banner';
    return errorResponse(message, 500);
  }
}

export const PUT = PATCH;

/**
 * DELETE /api/admin/hero-banners/[id]
 * Deactivates or removes a banner.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  const { id } = await context.params;
  if (!isValidId(id)) {
    return errorResponse('Invalid banner ID', 400);
  }

  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const permanent = url.searchParams.get('permanent') === 'true';

    if (permanent) {
      const existing = await HeroBanner.findById(id);
      if (!existing) {
        return errorResponse('Banner not found', 404);
      }

      if (existing.imageUrl) {
        await deleteUploadedBannerFile(existing.imageUrl, id);
      }

      await HeroBanner.findByIdAndDelete(id);
    } else {
      const banner = await HeroBanner.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      );
      if (!banner) {
        return errorResponse('Banner not found', 404);
      }
    }

    revalidateHeroBanners();

    return successResponse({
      message: permanent ? 'Banner permanently deleted' : 'Banner deactivated successfully',
      id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete hero banner';
    return errorResponse(message, 500);
  }
}
