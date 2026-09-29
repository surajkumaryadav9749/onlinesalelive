import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HeroBanner } from '@/models/HeroBanner';
import { checkAdminAuth, errorResponse, successResponse, isValidId } from '@/lib/api-helpers';
import { enforceMaxActiveBanners, deleteUploadedBannerFile } from '@/lib/hero-banners';
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
 * Updates banner details or toggles active status.
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

    const body = await req.json();
    let deactivatedOldest = false;

    // If activating an inactive banner, enforce max 5 active banners
    if (body.isActive === true && !existing.isActive) {
      const result = await enforceMaxActiveBanners(1, id);
      deactivatedOldest = result.deactivatedCount > 0;
    }

    if (body.title !== undefined) existing.title = String(body.title).trim();
    if (body.linkUrl !== undefined) existing.linkUrl = String(body.linkUrl).trim();
    if (body.imageUrl !== undefined) existing.imageUrl = String(body.imageUrl).trim();
    if (body.isActive !== undefined) existing.isActive = Boolean(body.isActive);
    if (body.displayOrder !== undefined) existing.displayOrder = Number(body.displayOrder) || 0;

    await existing.save();

    revalidateHeroBanners();

    return successResponse({
      banner: existing,
      deactivatedOldest,
      message: deactivatedOldest
        ? 'Banner activated. Oldest active banner was automatically deactivated.'
        : 'Banner updated successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update hero banner';
    return errorResponse(message, 500);
  }
}

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
