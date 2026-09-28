import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';
import { checkAdminAuth, errorResponse, successResponse, isValidId } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    const filter: Record<string, unknown> = all ? {} : { isPublished: true };
    const reviews = await Review.find(filter)
      .populate('product', 'name slug price originalPrice image discountPercent')
      .sort({ publishedAt: -1 })
      .lean();

    return successResponse(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch reviews', 500);
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
      product,
      productName,
      image,
      rating,
      verdict,
      pros,
      cons,
      specifications,
      price,
      originalPrice,
      discountPercent,
      marketplaces,
      author,
      isPublished,
      seoTitle,
      seoDescription,
    } = body;

    if (!title || !slug) {
      return errorResponse('Review title and slug are required');
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    const existing = await Review.findOne({ slug: normalizedSlug });
    if (existing) {
      return errorResponse(`Review with slug '${normalizedSlug}' already exists`);
    }

    let prodId;
    let prodSlug = '';
    let prodName = productName || '';
    if (product) {
      const prodDoc = isValidId(product)
        ? await Product.findById(product)
        : await Product.findOne({ slug: String(product).toLowerCase() });
      if (prodDoc) {
        prodId = prodDoc._id;
        prodSlug = prodDoc.slug;
        if (!prodName) prodName = prodDoc.name;
      }
    }

    const review = await Review.create({
      title: String(title).trim(),
      slug: normalizedSlug,
      excerpt: excerpt || '',
      content: content || '',
      product: prodId,
      productSlug: prodSlug,
      productName: prodName,
      image: image || '',
      rating: rating ? Number(rating) : 4.5,
      verdict: verdict || '',
      pros: Array.isArray(pros) ? pros : [],
      cons: Array.isArray(cons) ? cons : [],
      specifications: specifications || {},
      price: price ? Number(price) : 0,
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      discountPercent: discountPercent ? Number(discountPercent) : 0,
      marketplaces: Array.isArray(marketplaces) ? marketplaces : [],
      author: author || 'Review Desk',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
    });

    return successResponse(review, 201);
  } catch (err) {
    console.error('Error creating review:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to create review', 500);
  }
}
