import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';
import { connectToDatabase } from '@/lib/db';
import { Product as ProductModel } from '@/models/Product';
import { Category as CategoryModel } from '@/models/Category';
import { Guide as GuideModel } from '@/models/Guide';
import { Review as ReviewModel } from '@/models/Review';
import { Article as ArticleModel } from '@/models/Article';
import { Comparison as ComparisonModel } from '@/models/Comparison';
import { products as mockProducts } from '@/data/products';
import { categories as mockCategories } from '@/data/categories';
import { guides as mockGuides } from '@/data/guides';
import { reviews as mockReviews } from '@/data/reviews';
import { blogPosts as mockBlogPosts } from '@/data/blog';
import { mockComparisons } from '@/lib/data-service';

interface DynamicSitemapEntry {
  slug: string;
  updatedAt?: Date | string;
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // 1. Fetch dynamic entries with real timestamps
  let products: DynamicSitemapEntry[] = [];
  let categories: DynamicSitemapEntry[] = [];
  let guides: DynamicSitemapEntry[] = [];
  let reviews: DynamicSitemapEntry[] = [];
  let blogPosts: DynamicSitemapEntry[] = [];
  let comparisons: DynamicSitemapEntry[] = [];

  try {
    if (process.env.MONGODB_URI) {
      await connectToDatabase();
      const [prodDocs, catDocs, guideDocs, revDocs, artDocs, compDocs] = await Promise.all([
        ProductModel.find({ isActive: { $ne: false } }, { slug: 1, updatedAt: 1 }).lean(),
        CategoryModel.find({ isActive: { $ne: false } }, { slug: 1, updatedAt: 1 }).lean(),
        GuideModel.find({ isPublished: true }, { slug: 1, updatedAt: 1 }).lean(),
        ReviewModel.find({ isPublished: true }, { slug: 1, updatedAt: 1, publishedAt: 1 }).lean(),
        ArticleModel.find({ isPublished: true }, { slug: 1, updatedAt: 1, publishedAt: 1 }).lean(),
        ComparisonModel.find({ isPublished: { $ne: false } }, { slug: 1, updatedAt: 1 }).lean(),
      ]);

      products = (prodDocs as unknown as DynamicSitemapEntry[]) || [];
      categories = (catDocs as unknown as DynamicSitemapEntry[]) || [];
      guides = (guideDocs as unknown as DynamicSitemapEntry[]) || [];
      reviews = (revDocs as unknown as DynamicSitemapEntry[]) || [];
      blogPosts = (artDocs as unknown as DynamicSitemapEntry[]) || [];
      comparisons = (compDocs as unknown as DynamicSitemapEntry[]) || [];
    }
  } catch (err) {
    console.warn('[Sitemap] Database lookup failed, using fallback data:', err);
  }

  // Mock sitemap fallback may only be used when MONGODB_URI is absent (or ENABLE_MOCK_FALLBACK=true for tests)
  const allowMockSitemap = !process.env.MONGODB_URI || process.env.ENABLE_MOCK_FALLBACK === 'true';

  if (allowMockSitemap) {
    if (products.length === 0) {
      products = mockProducts.map((p) => ({ slug: p.slug }));
    }
    if (categories.length === 0) {
      categories = mockCategories.map((c) => ({ slug: c.slug }));
    }
    if (guides.length === 0) {
      guides = mockGuides.map((g) => ({ slug: g.slug, updatedAt: g.updatedAt }));
    }
    if (reviews.length === 0) {
      reviews = mockReviews.map((r) => ({ slug: r.slug, updatedAt: r.date }));
    }
    if (blogPosts.length === 0) {
      blogPosts = mockBlogPosts.map((b) => ({ slug: b.slug, updatedAt: b.date }));
    }
    if (comparisons.length === 0) {
      comparisons = mockComparisons.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt }));
    }
  }

  // 2. Static indexable core routes (strictly excluding /search, /admin, /api, /go)
  const staticPaths = [
    '',
    '/deals',
    '/todays-deals',
    '/discounts',
    '/sale',
    '/categories',
    '/products',
    '/compare',
    '/guides',
    '/reviews',
    '/blog',
    '/products-under-500',
    '/products-under-1000',
    '/products-under-2000',
    '/products-under-5000',
    '/about',
    '/contact',
    '/affiliate-disclosure',
    '/privacy-policy',
    '/terms',
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === '' || route.includes('deals') ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.includes('deals') || route.includes('products') ? 0.9 : 0.8,
  }));

  // Helper to parse date safely without fabricating
  const parseLastMod = (dateVal?: Date | string): Date | undefined => {
    if (!dateVal) return undefined;
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? undefined : d;
  };

  // 3. Dynamic Product routes
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => {
    const lastMod = parseLastMod(product.updatedAt);
    return {
      url: `${baseUrl}/product/${product.slug}`,
      ...(lastMod ? { lastModified: lastMod } : {}),
      changeFrequency: 'daily',
      priority: 0.8,
    };
  });

  // 4. Dynamic Category routes
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => {
    const lastMod = parseLastMod(category.updatedAt);
    return {
      url: `${baseUrl}/category/${category.slug}`,
      ...(lastMod ? { lastModified: lastMod } : {}),
      changeFrequency: 'weekly',
      priority: 0.8,
    };
  });

  // 5. Dynamic Guide routes
  const guideRoutes: MetadataRoute.Sitemap = guides.map((guide) => {
    const lastMod = parseLastMod(guide.updatedAt);
    return {
      url: `${baseUrl}/guides/${guide.slug}`,
      ...(lastMod ? { lastModified: lastMod } : {}),
      changeFrequency: 'weekly',
      priority: 0.7,
    };
  });

  // 6. Dynamic Review routes
  const reviewRoutes: MetadataRoute.Sitemap = reviews.map((review) => {
    const lastMod = parseLastMod(review.updatedAt);
    return {
      url: `${baseUrl}/reviews/${review.slug}`,
      ...(lastMod ? { lastModified: lastMod } : {}),
      changeFrequency: 'weekly',
      priority: 0.7,
    };
  });

  // 7. Dynamic Blog routes
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => {
    const lastMod = parseLastMod(post.updatedAt);
    return {
      url: `${baseUrl}/blog/${post.slug}`,
      ...(lastMod ? { lastModified: lastMod } : {}),
      changeFrequency: 'monthly',
      priority: 0.6,
    };
  });

  // 8. Dynamic Comparison routes
  const comparisonRoutes: MetadataRoute.Sitemap = comparisons.map((comp) => {
    const lastMod = parseLastMod(comp.updatedAt);
    return {
      url: `${baseUrl}/compare/${comp.slug}`,
      ...(lastMod ? { lastModified: lastMod } : {}),
      changeFrequency: 'weekly',
      priority: 0.7,
    };
  });

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...guideRoutes,
    ...reviewRoutes,
    ...blogRoutes,
    ...comparisonRoutes,
  ];
}
