import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { revalidateCatalog } from '@/lib/revalidate';

export async function GET(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return errorResponse('Database connection failed', 503);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const all = searchParams.get('all') === 'true';

    const filter: Record<string, unknown> = all ? {} : { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const categories = await Category.find(filter).sort({ name: 1 }).lean();
    return successResponse(categories);
  } catch (err) {
    console.error('Error fetching categories:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch categories', 500);
  }
}

import {
  validateCategoryImageFile,
  saveUploadedCategoryFile,
} from '@/lib/category-images';

export async function POST(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return errorResponse('Database connection failed', 503);
    }

    const contentType = req.headers.get('content-type') || '';
    let name = '';
    let slug = '';
    let description = '';
    let icon = 'Tv';
    let iconKey = '';
    let image = '';
    let imageUrl = '';
    let featured = false;
    let isActive = true;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Check for uploaded file in 'image', 'file', or 'categoryImage'
      const fileEntry = formData.get('image') ?? formData.get('file') ?? formData.get('categoryImage');
      let uploadedFile: File | null = null;
      if (fileEntry instanceof Blob && fileEntry.size > 0) {
        uploadedFile = fileEntry as File;
      }

      const rawName = formData.get('name');
      if (typeof rawName === 'string') name = rawName.trim();

      const rawSlug = formData.get('slug');
      if (typeof rawSlug === 'string') slug = rawSlug.trim();

      const rawDesc = formData.get('description');
      if (typeof rawDesc === 'string') description = rawDesc.trim();

      const rawIcon = formData.get('icon');
      if (typeof rawIcon === 'string') icon = rawIcon.trim() || 'Tv';

      const rawIconKey = formData.get('iconKey');
      if (typeof rawIconKey === 'string') iconKey = rawIconKey.trim() || icon;

      const rawFeatured = formData.get('featured');
      if (rawFeatured !== null && rawFeatured !== undefined) {
        featured = rawFeatured === 'true' || rawFeatured === '1';
      }

      const rawIsActive = formData.get('isActive');
      if (rawIsActive !== null && rawIsActive !== undefined) {
        isActive = rawIsActive === 'true' || rawIsActive === '1';
      }

      const rawImageUrl = formData.get('imageUrl');
      if (typeof rawImageUrl === 'string' && rawImageUrl.trim()) {
        imageUrl = rawImageUrl.trim();
      }

      const rawImage = formData.get('image');
      if (typeof rawImage === 'string' && rawImage.trim()) {
        image = rawImage.trim();
        if (!imageUrl) imageUrl = image;
      }

      if (uploadedFile) {
        const validation = validateCategoryImageFile(uploadedFile);
        if (!validation.valid) {
          return errorResponse(validation.error || 'Invalid category image file', 400);
        }
        imageUrl = await saveUploadedCategoryFile(uploadedFile, slug);
        image = imageUrl;
      }
    } else {
      const body = await req.json();
      name = (body.name || '').trim();
      slug = (body.slug || '').trim();
      description = (body.description || '').trim();
      icon = (body.icon || '').trim() || 'Tv';
      iconKey = (body.iconKey || '').trim() || icon;
      image = (body.image || '').trim();
      imageUrl = (body.imageUrl || '').trim() || image;
      image = imageUrl;
      featured = Boolean(body.featured);
      isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    }

    if (!name || !slug) {
      return errorResponse('Category name and slug are required');
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    const existing = await Category.findOne({ slug: normalizedSlug });
    if (existing) {
      return errorResponse(`Category with slug '${normalizedSlug}' already exists`);
    }

    const finalImage = imageUrl || image || '';
    const finalIcon = iconKey || icon || 'Tv';

    const category = await Category.create({
      name: String(name).trim(),
      slug: normalizedSlug,
      description: description || '',
      icon: finalIcon,
      iconKey: finalIcon,
      image: finalImage,
      imageUrl: finalImage,
      featured: Boolean(featured),
      isActive: Boolean(isActive),
    });

    revalidateCatalog(undefined, normalizedSlug);
    return successResponse(category, 201);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create category';
    console.error('Error creating category:', err);
    return errorResponse(errorMsg || 'Failed to create category', 500);
  }
}
