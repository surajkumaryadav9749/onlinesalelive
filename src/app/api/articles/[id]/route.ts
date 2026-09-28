import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Article } from '@/models/Article';
import { checkAdminAuth, errorResponse, successResponse, isValidId } from '@/lib/api-helpers';
import { revalidateContent } from '@/lib/revalidate';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const article = await Article.findOne(query).lean();

    if (!article) return errorResponse('Article not found', 404);
    return successResponse(article);
  } catch (err) {
    console.error('Error fetching article:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch article', 500);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const body = await req.json();

    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const existing = await Article.findOne(query);
    if (!existing) return errorResponse('Article not found', 404);

    if (body.slug && body.slug !== existing.slug) {
      const normalizedSlug = String(body.slug).trim().toLowerCase();
      const duplicate = await Article.findOne({
        slug: normalizedSlug,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        return errorResponse(`Article with slug '${normalizedSlug}' already exists`);
      }
      existing.slug = normalizedSlug;
    }

    if (body.title !== undefined) existing.title = String(body.title).trim();
    if (body.excerpt !== undefined) existing.excerpt = String(body.excerpt).trim();
    if (body.content !== undefined) existing.content = String(body.content);
    if (body.image !== undefined) existing.image = String(body.image).trim();
    if (body.category !== undefined) existing.category = String(body.category).trim();
    if (body.author !== undefined) existing.author = String(body.author).trim();
    if (body.readTime !== undefined) existing.readTime = String(body.readTime).trim();
    if (body.isPublished !== undefined) existing.isPublished = Boolean(body.isPublished);
    if (body.seoTitle !== undefined) existing.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) existing.seoDescription = body.seoDescription;

    await existing.save();
    revalidateContent('article', existing.slug);
    return successResponse(existing);
  } catch (err) {
    console.error('Error updating article:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to update article', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const article = await Article.findOne(query);
    if (!article) return errorResponse('Article not found', 404);

    const articleSlug = article.slug;
    await Article.deleteOne({ _id: article._id });
    revalidateContent('article', articleSlug);
    return successResponse({ message: 'Article deleted successfully', id: article._id });
  } catch (err) {
    console.error('Error deleting article:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to delete article', 500);
  }
}
