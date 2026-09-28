import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { checkAdminAuth, errorResponse, successResponse, isValidId } from '@/lib/api-helpers';
import { revalidateCatalog } from '@/lib/revalidate';

export async function GET(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const dealType = searchParams.get('dealType');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured');
    const all = searchParams.get('all') === 'true';
    const limit = Number(searchParams.get('limit')) || 100;

    const filter: Record<string, unknown> = all ? {} : { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      filter.categorySlug = category.toLowerCase();
    }

    if (dealType && dealType !== 'all') {
      filter.dealType = dealType;
    }

    if (maxPrice) {
      filter.price = { $lte: Number(maxPrice) };
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return successResponse(products);
  } catch (err) {
    console.error('Error fetching products:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch products', 500);
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
      name,
      slug,
      description,
      image,
      images,
      category,
      price,
      originalPrice,
      discountPercent,
      rating,
      reviewCount,
      pros,
      cons,
      specifications,
      marketplaces,
      dealType,
      isFeatured,
      isTrending,
      badgeText,
      isActive,
    } = body;

    if (!name || !slug || !price || !originalPrice || !category) {
      return errorResponse('Required fields missing: name, slug, price, originalPrice, and category are mandatory');
    }

    // Validate Category
    let categoryDoc;
    if (isValidId(category)) {
      categoryDoc = await Category.findById(category);
    } else {
      categoryDoc = await Category.findOne({ slug: String(category).toLowerCase() });
    }

    if (!categoryDoc) {
      return errorResponse('Specified Category does not exist');
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    const existing = await Product.findOne({ slug: normalizedSlug });
    if (existing) {
      return errorResponse(`Product with slug '${normalizedSlug}' already exists`);
    }

    // Auto-calculate discount if not provided
    const numPrice = Number(price);
    const numOriginal = Number(originalPrice);
    const calculatedDiscount =
      discountPercent !== undefined
        ? Number(discountPercent)
        : numOriginal > numPrice
        ? Math.round(((numOriginal - numPrice) / numOriginal) * 100)
        : 0;

    const product = await Product.create({
      name: String(name).trim(),
      slug: normalizedSlug,
      description: description || '',
      image: image || '',
      images: Array.isArray(images) ? images : image ? [image] : [],
      category: categoryDoc._id,
      categorySlug: categoryDoc.slug,
      price: numPrice,
      originalPrice: numOriginal,
      discountPercent: calculatedDiscount,
      rating: rating ? Number(rating) : 4.0,
      reviewCount: reviewCount ? Number(reviewCount) : 0,
      pros: Array.isArray(pros) ? pros : [],
      cons: Array.isArray(cons) ? cons : [],
      specifications: specifications || {},
      marketplaces: Array.isArray(marketplaces) ? marketplaces : [],
      dealType: dealType || "Today's Deal",
      isFeatured: Boolean(isFeatured),
      isTrending: Boolean(isTrending),
      badgeText: badgeText || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    revalidateCatalog(product.slug, product.categorySlug);
    return successResponse(product, 201);
  } catch (err) {
    console.error('Error creating product:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to create product', 500);
  }
}
