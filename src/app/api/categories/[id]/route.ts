import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
import { checkAdminAuth, errorResponse, successResponse, isValidId } from '@/lib/api-helpers';
import { revalidateCatalog } from '@/lib/revalidate';

import {
  validateCategoryImageFile,
  saveUploadedCategoryFile,
  deleteUploadedCategoryFile,
} from '@/lib/category-images';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const category = await Category.findOne(query).lean();

    if (!category) return errorResponse('Category not found', 404);
    return successResponse(category);
  } catch (err) {
    console.error('Error fetching category:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch category', 500);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const existing = await Category.findOne(query);
    if (!existing) return errorResponse('Category not found', 404);

    const contentType = (req.headers.get('content-type') || '').toLowerCase();
    let name: string | undefined;
    let slug: string | undefined;
    let description: string | undefined;
    let icon: string | undefined;
    let iconKey: string | undefined;
    let image: string | undefined;
    let imageUrl: string | undefined;
    let featured: boolean | undefined;
    let isActive: boolean | undefined;
    let uploadedFile: File | null = null;
    let removeImage = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Check for file in 'image', 'file', or 'categoryImage'
      const fileEntry = formData.get('image') ?? formData.get('file') ?? formData.get('categoryImage');
      if (fileEntry instanceof Blob && fileEntry.size > 0) {
        uploadedFile = fileEntry as File;
      }

      // Safely extract string fields
      const rawName = formData.get('name');
      if (typeof rawName === 'string') name = rawName.trim();

      const rawSlug = formData.get('slug');
      if (typeof rawSlug === 'string') slug = rawSlug.trim();

      const rawDesc = formData.get('description');
      if (typeof rawDesc === 'string') description = rawDesc.trim();

      const rawIcon = formData.get('icon');
      if (typeof rawIcon === 'string') icon = rawIcon.trim();

      const rawIconKey = formData.get('iconKey');
      if (typeof rawIconKey === 'string') iconKey = rawIconKey.trim();

      const rawFeatured = formData.get('featured');
      if (rawFeatured !== null && rawFeatured !== undefined) {
        featured = rawFeatured === 'true' || rawFeatured === '1';
      }

      const rawIsActive = formData.get('isActive');
      if (rawIsActive !== null && rawIsActive !== undefined) {
        isActive = rawIsActive === 'true' || rawIsActive === '1';
      }

      const rawRemove = formData.get('removeImage');
      if (rawRemove !== null && rawRemove !== undefined) {
        removeImage = rawRemove === 'true' || rawRemove === '1';
      }

      // If text string URL was passed for image/imageUrl
      const rawImageUrl = formData.get('imageUrl');
      if (typeof rawImageUrl === 'string' && rawImageUrl.trim()) {
        imageUrl = rawImageUrl.trim();
      }

      const rawImage = formData.get('image');
      if (typeof rawImage === 'string' && rawImage.trim()) {
        image = rawImage.trim();
        if (!imageUrl) imageUrl = image;
      }
    } else {
      const body = await req.json();
      if (body.name !== undefined) name = String(body.name).trim();
      if (body.slug !== undefined) slug = String(body.slug).trim();
      if (body.description !== undefined) description = String(body.description).trim();
      if (body.icon !== undefined) icon = String(body.icon).trim();
      if (body.iconKey !== undefined) iconKey = String(body.iconKey).trim();
      if (body.image !== undefined) image = String(body.image).trim();
      if (body.imageUrl !== undefined) imageUrl = String(body.imageUrl).trim();
      if (body.featured !== undefined) featured = Boolean(body.featured);
      if (body.isActive !== undefined) isActive = Boolean(body.isActive);
      if (body.removeImage !== undefined) removeImage = Boolean(body.removeImage);
    }

    if (slug && slug !== existing.slug) {
      const normalizedSlug = slug.toLowerCase();
      const duplicate = await Category.findOne({
        slug: normalizedSlug,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        return errorResponse(`Category with slug '${normalizedSlug}' already exists`);
      }
      existing.slug = normalizedSlug;
    }

    if (name !== undefined) existing.name = name;
    if (description !== undefined) existing.description = description;

    const chosenIcon = iconKey !== undefined ? iconKey : icon;
    if (chosenIcon !== undefined) {
      existing.icon = chosenIcon;
      existing.iconKey = chosenIcon;
    }

    // Handle Image Replacement / Upload / Removal
    const oldImage = existing.imageUrl || existing.image || '';

    if (uploadedFile) {
      const validation = validateCategoryImageFile(uploadedFile);
      if (!validation.valid) {
        return errorResponse(validation.error || 'Invalid category image file', 400);
      }
      const newImageUrl = await saveUploadedCategoryFile(uploadedFile, existing.slug);

      // Clean up old file if it was an uploaded file
      if (oldImage && oldImage !== newImageUrl) {
        await deleteUploadedCategoryFile(oldImage, existing._id.toString());
      }

      existing.imageUrl = newImageUrl;
      existing.image = newImageUrl;
    } else if (removeImage) {
      if (oldImage) {
        await deleteUploadedCategoryFile(oldImage, existing._id.toString());
      }
      existing.imageUrl = '';
      existing.image = '';
    } else if (imageUrl !== undefined || image !== undefined) {
      const newImageVal = (imageUrl !== undefined ? imageUrl : image) || '';

      if (oldImage && oldImage !== newImageVal) {
        await deleteUploadedCategoryFile(oldImage, existing._id.toString());
      }

      existing.imageUrl = newImageVal;
      existing.image = newImageVal;
    }

    if (featured !== undefined) existing.featured = featured;
    if (isActive !== undefined) existing.isActive = isActive;

    await existing.save();
    revalidateCatalog(undefined, existing.slug);
    return successResponse(existing);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update category';
    console.error('Error updating category:', err);
    return errorResponse(errorMsg || 'Failed to update category', 500);
  }
}

export const PATCH = PUT;

export async function DELETE(req: NextRequest, { params }: Params) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const category = await Category.findOne(query);
    if (!category) return errorResponse('Category not found', 404);

    // Relationship check: do not orphan products
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return errorResponse(
        `Cannot delete category '${category.name}' because ${productCount} products are linked to it. Reassign or delete those products first.`,
        400
      );
    }

    const catSlug = category.slug;
    const imageToDelete = category.imageUrl || category.image || '';

    await Category.deleteOne({ _id: category._id });

    // Clean up uploaded image if exists
    if (imageToDelete) {
      await deleteUploadedCategoryFile(imageToDelete, category._id.toString());
    }

    revalidateCatalog(undefined, catSlug);
    return successResponse({ message: 'Category deleted successfully', id: category._id });
  } catch (err) {
    console.error('Error deleting category:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to delete category', 500);
  }
}
