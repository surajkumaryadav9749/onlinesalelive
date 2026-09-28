import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Article } from '@/models/Article';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const all = searchParams.get('all') === 'true';

    const filter: Record<string, unknown> = all ? {} : { isPublished: true };
    if (category) {
      filter.category = category;
    }

    const articles = await Article.find(filter).sort({ publishedAt: -1 }).lean();
    return successResponse(articles);
  } catch (err) {
    console.error('Error fetching articles:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch articles', 500);
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const body = await req.json();
    const {
      title,
      slug,
      excerpt,
      content,
      image,
      category,
      author,
      readTime,
      isPublished,
      seoTitle,
      seoDescription,
    } = body;

    if (!title || !slug) {
      return errorResponse('Article title and slug are required');
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    const existing = await Article.findOne({ slug: normalizedSlug });
    if (existing) {
      return errorResponse(`Article with slug '${normalizedSlug}' already exists`);
    }

    const article = await Article.create({
      title: String(title).trim(),
      slug: normalizedSlug,
      excerpt: excerpt || '',
      content: content || '',
      image: image || '',
      category: category || 'Shopping Tips',
      author: author || 'Deals Intelligence Team',
      readTime: readTime || '4 min read',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
    });

    return successResponse(article, 201);
  } catch (err) {
    console.error('Error creating article:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to create article', 500);
  }
}
