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
      name = (formData.get('name') as string || '').trim();
      slug = (formData.get('slug') as string || '').trim();
      description = (formData.get('description') as string || '').trim();
      icon = (formData.get('icon') as string || '').trim() || 'Tv';
      iconKey = (formData.get('iconKey') as string || '').trim() || icon;
      image = (formData.get('image') as string || '').trim();
      imageUrl = (formData.get('imageUrl') as string || '').trim() || image;

      const featuredVal = formData.get('featured');
      if (featuredVal !== null) {
        featured = featuredVal === 'true' || featuredVal === '1';
      }

      const activeVal = formData.get('isActive');
      if (activeVal !== null) {
        isActive = activeVal === 'true' || activeVal === '1';
      }

      const file = formData.get('file');
      if (file && typeof file !== 'string') {
        const fileObj = file as File;
        const validation = validateCategoryImageFile(fileObj);
        if (!validation.valid) {
          return errorResponse(validation.error || 'Invalid category image file', 400);
        }
        imageUrl = await saveUploadedCategoryFile(fileObj, slug);
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
  } catch (err) {
    console.error('Error creating category:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to create category', 500);
  }
}
