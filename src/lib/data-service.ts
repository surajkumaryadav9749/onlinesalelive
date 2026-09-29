import { products as mockProducts } from '@/data/products';
import { categories as mockCategories } from '@/data/categories';
import { deals as mockDeals } from '@/data/deals';
import { guides as mockGuides } from '@/data/guides';
import { reviews as mockReviews } from '@/data/reviews';
import { blogPosts as mockBlogPosts } from '@/data/blog';
import {
  Product,
  Category,
  Deal,
  DealType,
  Guide,
  Review,
  BlogPost,
  ComparisonItem,
  HeroBanner,
  HomepageDiscoveryData,
  DiscountCategoryItem,
  BudgetTierItem,
  DiscoveryCategoryItem,
} from '@/types';
import { connectToDatabase } from '@/lib/db';
import { calculateDiscount, getDealStatus, isDealCurrentlyActive } from '@/lib/deal-utils';
import { Product as ProductModel } from '@/models/Product';
import { Category as CategoryModel } from '@/models/Category';
import { Deal as DealModel } from '@/models/Deal';
import { Guide as GuideModel } from '@/models/Guide';
import { Review as ReviewModel } from '@/models/Review';
import { Article as ArticleModel } from '@/models/Article';
import { Comparison as ComparisonModel } from '@/models/Comparison';
import { AffiliateClick as AffiliateClickModel } from '@/models/AffiliateClick';
import { HeroBanner as HeroBannerModel } from '@/models/HeroBanner';
import { matchesDiscountRange } from '@/lib/filter-utils';

// Helper to execute MongoDB query with mock fallback
async function withDbFallback<T>(dbQuery: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  const allowMockFallback = !process.env.MONGODB_URI || process.env.ENABLE_MOCK_FALLBACK === 'true';

  if (!process.env.MONGODB_URI) {
    return await fallback();
  }

  try {
    await connectToDatabase();
    const result = await dbQuery();

    // When a valid MONGODB_URI exists and MongoDB responds, preserve real DB state:
    // - Empty array [] from MongoDB MUST remain [].
    // - null/undefined from findOne() MUST remain null/undefined so normal notFound/empty-state behavior works.
    // - Do NOT fallback to mock data merely because a collection is empty or findOne returns no doc.
    if (!allowMockFallback) {
      return result;
    }

    // Mock fallback only for offline development or explicit test environments
    if (result === null || result === undefined) {
      return await fallback();
    }
    if (Array.isArray(result) && result.length === 0) {
      const fb = await fallback();
      return (Array.isArray(fb) && fb.length > 0) ? fb : result;
    }
    if (
      typeof result === 'object' &&
      result !== null &&
      'products' in (result as Record<string, unknown>) &&
      Array.isArray((result as unknown as { products: unknown[] }).products) &&
      (result as unknown as { products: unknown[] }).products.length === 0
    ) {
      return await fallback();
    }
    if (
      typeof result === 'object' &&
      result !== null &&
      'deals' in (result as Record<string, unknown>) &&
      Array.isArray((result as unknown as { deals: unknown[] }).deals) &&
      (result as unknown as { deals: unknown[] }).deals.length === 0
    ) {
      return await fallback();
    }
    return result;
  } catch (err) {
    console.warn('[DataService] Database query error:', err);
    if (allowMockFallback) {
      return await fallback();
    }
    throw err;
  }
}

// Raw MongoDB Document Types for Mappers
interface RawProductDoc {
  _id: unknown;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  category?: unknown;
  categorySlug?: string;
  pros?: string[];
  cons?: string[];
  specifications?: Record<string, string>;
  marketplaces?: Product['marketplaces'];
  dealType?: DealType;
  isFeatured?: boolean;
  isTrending?: boolean;
  badgeText?: string;
  createdAt?: string | Date;
}

interface RawCategoryDoc {
  _id: unknown;
  name: string;
  slug: string;
  icon?: string;
  iconKey?: string;
  description?: string;
  itemCount?: number;
  image?: string;
  imageUrl?: string;
  featured?: boolean;
  isActive?: boolean;
}

interface RawDealDoc {
  _id: unknown;
  title: string;
  slug: string;
  product?: unknown;
  productSlug?: string;
  image?: string;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  marketplace: Deal['marketplace'];
  marketplaceUrl?: string;
  affiliateUrl?: string;
  isAffiliate?: boolean;
  dealType: DealType;
  endsIn?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: 'active' | 'upcoming' | 'expired' | 'inactive';
  verified?: boolean;
  isActive?: boolean;
}

interface RawGuideDoc {
  _id: unknown;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category?: string;
  categorySlug?: string;
  readTime?: string;
  updatedAt?: string | Date;
  author?: string;
  image?: string;
  topPicks?: Guide['topPicks'];
  comparisonTable?: Guide['comparisonTable'];
  pros?: string[];
  cons?: string[];
  buyingTips?: string[];
  relatedProductSlugs?: string[];
}

interface RawReviewDoc {
  _id: unknown;
  title: string;
  slug: string;
  productSlug?: string;
  productName?: string;
  image?: string;
  rating?: number;
  verdict?: string;
  pros?: string[];
  cons?: string[];
  specifications?: Record<string, string>;
  price?: number;
  originalPrice?: number;
  discountPercent?: number;
  marketplaces?: Product['marketplaces'];
  publishedAt?: string | Date;
  author?: string;
}

interface RawArticleDoc {
  _id: unknown;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category?: string;
  author?: string;
  publishedAt?: string | Date;
  readTime?: string;
  image?: string;
}

interface RawComparisonDoc {
  _id: unknown;
  title: string;
  slug: string;
  description?: string;
  products?: unknown[];
  productSlugs?: string[];
  content?: string;
  image?: string;
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export function getSafeProductImage(image?: string, name?: string): string {
  if (image && typeof image === 'string' && image.trim() !== '') {
    return image.trim();
  }
  const cleanName = (name || 'Product').trim().slice(0, 20);
  return `https://placehold.co/600x400/f1f5f9/475569?text=${encodeURIComponent(cleanName || 'OnlineSaleLive')}`;
}

// Mappers
function mapProduct(doc: RawProductDoc): Product {
  const catObj = doc.category as { name?: string } | undefined;
  const categoryName =
    typeof catObj === 'object' && catObj?.name
      ? catObj.name
      : doc.categorySlug
      ? doc.categorySlug.charAt(0).toUpperCase() + doc.categorySlug.slice(1)
      : 'Electronics';

  const safeImage = getSafeProductImage(doc.image, doc.name);
  const safeImages = Array.isArray(doc.images) && doc.images.length > 0
    ? doc.images.map((img) => getSafeProductImage(img, doc.name))
    : [safeImage];

  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description || '',
    image: safeImage,
    images: safeImages,
    price: doc.price,
    originalPrice: doc.originalPrice || doc.price,
    discountPercent: doc.discountPercent || 0,
    rating: doc.rating || 4.5,
    reviewCount: doc.reviewCount || 0,
    category: categoryName,
    categorySlug: doc.categorySlug || '',
    pros: doc.pros || [],
    cons: doc.cons || [],
    specifications: doc.specifications || {},
    marketplaces: Array.isArray(doc.marketplaces) ? doc.marketplaces : [],
    dealType: doc.dealType || "Today's Deal",
    featured: Boolean(doc.isFeatured),
    trending: Boolean(doc.isTrending),
    badgeText: doc.badgeText || '',
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
  };
}

function mapCategory(doc: RawCategoryDoc): Category {
  const finalImage = doc.imageUrl || doc.image || '';
  const finalIcon = doc.iconKey || doc.icon || 'Tag';
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    icon: finalIcon,
    iconKey: finalIcon,
    description: doc.description || '',
    itemCount: doc.itemCount || 0,
    image: finalImage,
    imageUrl: finalImage,
    featured: Boolean(doc.featured),
    isActive: doc.isActive !== false,
  };
}

function mapDeal(doc: RawDealDoc): Deal {
  let productObj: Product;
  if (doc.product && typeof doc.product === 'object' && 'name' in (doc.product as object)) {
    productObj = mapProduct(doc.product as RawProductDoc);
  } else {
    productObj = {
      id: doc.product ? String(doc.product) : String(doc._id),
      name: doc.title,
      slug: doc.productSlug || doc.slug,
      description: '',
      image: doc.image || '',
      price: doc.currentPrice,
      originalPrice: doc.originalPrice,
      discountPercent:
        doc.originalPrice > doc.currentPrice && doc.currentPrice > 0
          ? calculateDiscount(doc.currentPrice, doc.originalPrice)
          : doc.discountPercent,
      rating: 4.5,
      reviewCount: 120,
      category: 'Electronics',
      categorySlug: 'electronics',
      pros: [],
      cons: [],
      specifications: {},
      marketplaces: [
        {
          name: doc.marketplace,
          price: doc.currentPrice,
          originalPrice: doc.originalPrice,
          url: doc.marketplaceUrl || '#',
          affiliateUrl: doc.affiliateUrl || '',
          isAffiliate: Boolean(doc.isAffiliate),
          isActive: doc.isActive !== false,
          inStock: true,
        },
      ],
      dealType: doc.dealType,
    };
  }

  const calculatedDiscount =
    doc.originalPrice > doc.currentPrice && doc.currentPrice > 0
      ? calculateDiscount(doc.currentPrice, doc.originalPrice)
      : doc.discountPercent || 0;

  const dynamicStatus = getDealStatus({
    isActive: doc.isActive,
    startDate: doc.startDate,
    endDate: doc.endDate,
    status: doc.status,
  });

  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    product: productObj,
    dealType: doc.dealType,
    discountPercent: calculatedDiscount,
    marketplace: doc.marketplace,
    marketplaceUrl: doc.marketplaceUrl || '#',
    affiliateUrl: doc.affiliateUrl || '',
    isAffiliate: Boolean(doc.isAffiliate),
    endsIn: doc.endsIn || 'Limited time',
    startDate: doc.startDate ? new Date(doc.startDate).toISOString() : undefined,
    endDate: doc.endDate ? new Date(doc.endDate).toISOString() : undefined,
    status: dynamicStatus,
    verified: Boolean(doc.verified),
    isActive: doc.isActive !== false,
  };
}

function mapGuide(doc: RawGuideDoc): Guide {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt || '',
    content: doc.content || '',
    category: doc.category || '',
    categorySlug: doc.categorySlug || '',
    readTime: doc.readTime || '8 min read',
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString().split('T')[0] : 'Recently',
    author: doc.author || 'Editorial Team',
    image: doc.image || '',
    topPicks: doc.topPicks || [],
    comparisonTable: doc.comparisonTable || { headers: [], rows: [] },
    pros: doc.pros || [],
    cons: doc.cons || [],
    buyingTips: doc.buyingTips || [],
    relatedProductSlugs: doc.relatedProductSlugs || [],
  };
}

function mapReview(doc: RawReviewDoc): Review {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    productSlug: doc.productSlug || '',
    productName: doc.productName || doc.title,
    image: doc.image || '',
    rating: doc.rating || 4.5,
    verdict: doc.verdict || '',
    pros: doc.pros || [],
    cons: doc.cons || [],
    specifications: doc.specifications || {},
    price: doc.price || 0,
    originalPrice: doc.originalPrice || 0,
    discountPercent: doc.discountPercent || 0,
    marketplaces: doc.marketplaces || [],
    date: doc.publishedAt ? new Date(doc.publishedAt).toISOString().split('T')[0] : 'Recently',
    author: doc.author || 'Editorial Team',
    isEditorial: true,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
  };
}

function mapBlogPost(doc: RawArticleDoc): BlogPost {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt || '',
    content: doc.content || '',
    category: doc.category || 'Shopping Tips',
    author: doc.author || 'Deals Intelligence Team',
    date: doc.publishedAt ? new Date(doc.publishedAt).toISOString().split('T')[0] : 'Recently',
    readTime: doc.readTime || '5 min read',
    image: doc.image || '',
  };
}

function mapComparison(doc: RawComparisonDoc): ComparisonItem {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    description: doc.description || '',
    products: Array.isArray(doc.products)
      ? doc.products
          .map((p) =>
            typeof p === 'object' && p !== null && 'name' in p
              ? mapProduct(p as RawProductDoc)
              : undefined
          )
          .filter((p): p is Product => p !== undefined)
      : [],
    productSlugs: Array.isArray(doc.productSlugs) ? doc.productSlugs : [],
    content: doc.content || '',
    image: doc.image || '',
    isPublished: doc.isPublished !== false,
    seoTitle: doc.seoTitle,
    seoDescription: doc.seoDescription,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export const mockComparisons: ComparisonItem[] = [
  {
    id: 'comp-1',
    title: 'TWS Earbuds vs Wired Earphones Comparison',
    slug: 'earbuds-vs-headphones-comparison',
    description: 'Comprehensive specifications, audio fidelity, and latency comparison.',
    products: mockProducts.slice(0, 2),
    productSlugs: ['boat-airdopes-141-anc-earbuds', 'boat-bassheads-100-wired-earphones'],
    content: 'Detailed head-to-head performance matrix comparing battery life, noise cancellation, and Indian store prices.',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    isPublished: true,
    seoTitle: 'TWS Earbuds vs Wired Earphones Comparison | OnlineSaleLive',
    seoDescription: 'Side-by-side specs and price comparisons between popular personal audio gear in India.',
  },
];

// ================= Product Queries =================
export async function getAllProducts(): Promise<Product[]> {
  return withDbFallback(
    async () => {
      const docs = await ProductModel.find({ isActive: { $ne: false } })
        .populate('category')
        .sort({ createdAt: -1 })
        .lean();
      return docs.map(mapProduct);
    },
    () => mockProducts
  );
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return withDbFallback(
    async () => {
      const doc = await ProductModel.findOne({ slug: slug.toLowerCase(), isActive: { $ne: false } })
        .populate('category')
        .lean();
      return doc ? mapProduct(doc) : undefined;
    },
    () => mockProducts.find((p) => p.slug === slug)
  );
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  return withDbFallback(
    async () => {
      const docs = await ProductModel.find({
        categorySlug: categorySlug.toLowerCase(),
        isActive: { $ne: false },
      })
        .populate('category')
        .lean();
      return docs.map(mapProduct);
    },
    () => mockProducts.filter((p) => p.categorySlug.toLowerCase() === categorySlug.toLowerCase())
  );
}

export async function getProductsUnderPrice(maxPrice: number): Promise<Product[]> {
  return withDbFallback(
    async () => {
      const docs = await ProductModel.find({
        price: { $lte: maxPrice },
        isActive: { $ne: false },
      })
        .populate('category')
        .sort({ price: 1 })
        .lean();
      return docs.map(mapProduct);
    },
    () => mockProducts.filter((p) => p.price <= maxPrice)
  );
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return withDbFallback(
    async () => {
      let docs = await ProductModel.find({
        isFeatured: true,
        isActive: { $ne: false },
      })
        .populate('category')
        .limit(limit)
        .lean();

      if (docs.length === 0) {
        docs = await ProductModel.find({ isActive: { $ne: false } })
          .populate('category')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
      }

      return docs.map(mapProduct);
    },
    () => mockProducts.filter((p) => p.featured).slice(0, limit)
  );
}

export interface TrendingProductsResult {
  products: Product[];
  isCalculatedTrend: boolean;
  timeWindowDays: number;
  label: string;
}

export interface MostClickedResult {
  products: Product[];
  clickCounts: Record<string, number>;
  hasRealClickData: boolean;
  timeWindowDays: number;
}

export async function getTrendingProductsWithMeta(
  limitOrOptions: number | { limit?: number; days?: number } = 8,
  daysParam = 7
): Promise<TrendingProductsResult> {
  const rawLimit = typeof limitOrOptions === 'object' && limitOrOptions !== null ? limitOrOptions.limit : limitOrOptions;
  const rawDays = typeof limitOrOptions === 'object' && limitOrOptions !== null ? limitOrOptions.days : daysParam;
  const limitNum = typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? rawLimit : 8;
  const daysNum = typeof rawDays === 'number' && Number.isFinite(rawDays) ? rawDays : 7;
  const safeLimit = Math.max(1, Math.min(20, limitNum));
  const safeDays = Math.max(1, Math.min(30, daysNum));
  const sinceDate = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

  return withDbFallback(
    async () => {
      // 1. Query AffiliateClick aggregate for clicks in window
      const clickAgg = await AffiliateClickModel.aggregate([
        {
          $match: {
            createdAt: { $gte: sinceDate },
            productSlug: { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id: '$productSlug',
            recentClicks: { $sum: 1 },
            latestClick: { $max: '$createdAt' },
          },
        },
        { $sort: { recentClicks: -1 } },
        { $limit: safeLimit * 2 },
      ]);

      if (clickAgg.length > 0) {
        const clickedSlugs = clickAgg.map((c) => String(c._id));
        const activeProducts = await ProductModel.find({
          slug: { $in: clickedSlugs },
          isActive: { $ne: false },
        })
          .populate('category')
          .lean();

        const clickMap = new Map(
          clickAgg.map((c) => [
            String(c._id),
            {
              clicks: c.recentClicks,
              latest: new Date(c.latestClick).getTime(),
            },
          ])
        );

        // Documented trend score formula:
        // trendScore = (recentClicks * 10) + recencyBonus + (isTrending ? 25 : 0) + (isFeatured ? 10 : 0)
        // recencyBonus adds up to 15 points based on proximity to now
        const nowMs = Date.now();
        const scored = activeProducts.map((p) => {
          const stats = clickMap.get(p.slug) || { clicks: 0, latest: 0 };
          const hoursAgo = Math.max(0, (nowMs - stats.latest) / (1000 * 60 * 60));
          const recencyBonus = Math.max(0, Math.round(15 - hoursAgo / 4));
          const adminBonus = (p.isTrending ? 25 : 0) + (p.isFeatured ? 10 : 0);
          const trendScore = stats.clicks * 10 + recencyBonus + adminBonus;

          return { product: mapProduct(p), trendScore };
        });

        scored.sort((a, b) => b.trendScore - a.trendScore);

        return {
          products: scored.slice(0, safeLimit).map((s) => s.product),
          isCalculatedTrend: true,
          timeWindowDays: safeDays,
          label: 'Trending Now',
        };
      }

      // Fallback: items flagged as isTrending or isFeatured, or active products if none flagged
      let fallbackDocs = await ProductModel.find({
        $or: [{ isTrending: true }, { isFeatured: true }],
        isActive: { $ne: false },
      })
        .populate('category')
        .sort({ isTrending: -1, isFeatured: -1, createdAt: -1 })
        .limit(safeLimit)
        .lean();

      if (fallbackDocs.length === 0) {
        fallbackDocs = await ProductModel.find({ isActive: { $ne: false } })
          .populate('category')
          .sort({ createdAt: -1 })
          .limit(safeLimit)
          .lean();
      }

      return {
        products: fallbackDocs.map(mapProduct),
        isCalculatedTrend: false,
        timeWindowDays: safeDays,
        label: 'Featured Products',
      };
    },
    () => ({
      products: mockProducts.filter((p) => p.trending || p.featured).slice(0, safeLimit),
      isCalculatedTrend: false,
      timeWindowDays: safeDays,
      label: 'Featured Products',
    })
  );
}

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
  const res = await getTrendingProductsWithMeta(limit, 7);
  return res.products;
}

export async function getMostClickedProducts(
  options: { limit?: number; days?: number } = {}
): Promise<MostClickedResult> {
  const limit = Math.max(1, Math.min(20, options.limit || 8));
  const days = Math.max(1, Math.min(90, options.days || 7));
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return withDbFallback(
    async () => {
      const clickAgg = await AffiliateClickModel.aggregate([
        {
          $match: {
            createdAt: { $gte: sinceDate },
            productSlug: { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id: '$productSlug',
            totalClicks: { $sum: 1 },
          },
        },
        { $sort: { totalClicks: -1 } },
        { $limit: limit },
      ]);

      if (clickAgg.length === 0) {
        return {
          products: [],
          clickCounts: {},
          hasRealClickData: false,
          timeWindowDays: days,
        };
      }

      const slugs = clickAgg.map((c) => String(c._id));
      const clickCounts: Record<string, number> = {};
      clickAgg.forEach((c) => {
        clickCounts[String(c._id)] = c.totalClicks;
      });

      const docs = await ProductModel.find({
        slug: { $in: slugs },
        isActive: { $ne: false },
      })
        .populate('category')
        .lean();

      docs.sort((a, b) => (clickCounts[b.slug] || 0) - (clickCounts[a.slug] || 0));

      return {
        products: docs.map(mapProduct),
        clickCounts,
        hasRealClickData: true,
        timeWindowDays: days,
      };
    },
    () => ({
      products: [],
      clickCounts: {},
      hasRealClickData: false,
      timeWindowDays: days,
    })
  );
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeSlug: string,
  limit = 4,
  targetPrice?: number
): Promise<Product[]> {
  const cat = (categorySlug || '').trim().toLowerCase();
  const excl = (excludeSlug || '').trim().toLowerCase();

  return withDbFallback(
    async () => {
      const filter: Record<string, unknown> = {
        categorySlug: cat,
        slug: { $ne: excl },
        isActive: { $ne: false },
      };

      if (typeof targetPrice === 'number' && targetPrice > 0) {
        filter.price = {
          $gte: Math.round(targetPrice * 0.4),
          $lte: Math.round(targetPrice * 2.5),
        };
      }

      let docs = await ProductModel.find(filter)
        .populate('category')
        .limit(limit)
        .lean();

      if (docs.length === 0 && targetPrice) {
        delete filter.price;
        docs = await ProductModel.find(filter)
          .populate('category')
          .limit(limit)
          .lean();
      }

      return docs.map(mapProduct);
    },
    () =>
      mockProducts
        .filter((p) => p.categorySlug.toLowerCase() === cat && p.slug.toLowerCase() !== excl)
        .slice(0, limit)
  );
}

// ================= Category Queries =================
export async function getAllCategories(): Promise<Category[]> {
  return withDbFallback(
    async () => {
      const docs = await CategoryModel.find({ isActive: { $ne: false } })
        .sort({ name: 1 })
        .lean();

      // Aggregate live product counts per category
      const productCounts = await ProductModel.aggregate([
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: '$categorySlug', count: { $sum: 1 } } },
      ]);
      const countMap = new Map(productCounts.map((c) => [String(c._id).toLowerCase(), c.count]));

      return docs.map((doc) => {
        const cat = mapCategory(doc);
        const dynamicCount = countMap.get(cat.slug.toLowerCase()) || 0;
        return {
          ...cat,
          itemCount: Math.max(cat.itemCount, dynamicCount),
        };
      });
    },
    () => mockCategories
  );
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return withDbFallback(
    async () => {
      const doc = await CategoryModel.findOne({
        slug: slug.toLowerCase(),
        isActive: { $ne: false },
      }).lean();
      if (!doc) return undefined;

      const dynamicCount = await ProductModel.countDocuments({
        categorySlug: slug.toLowerCase(),
        isActive: { $ne: false },
      });

      const cat = mapCategory(doc);
      return {
        ...cat,
        itemCount: Math.max(cat.itemCount, dynamicCount),
      };
    },
    () => mockCategories.find((c) => c.slug.toLowerCase() === slug.toLowerCase())
  );
}

export async function getFeaturedCategories(limit = 8): Promise<Category[]> {
  return withDbFallback(
    async () => {
      let docs = await CategoryModel.find({
        featured: true,
        isActive: { $ne: false },
      })
        .limit(limit)
        .lean();

      if (docs.length === 0) {
        docs = await CategoryModel.find({ isActive: { $ne: false } })
          .sort({ name: 1 })
          .limit(limit)
          .lean();
      }

      return docs.map(mapCategory);
    },
    () => mockCategories.filter((c) => c.featured).slice(0, limit)
  );
}

// Convert a Product with a deal/discount into a Deal object
export function productToDeal(product: Product): Deal {
  const primaryOffer =
    (product.marketplaces || []).find((m) => m.isActive !== false) ||
    product.marketplaces?.[0];

  return {
    id: `prod-deal-${product.id}`,
    title: product.name,
    slug: product.slug,
    product,
    dealType: product.dealType || 'Price Drop',
    discountPercent: product.discountPercent,
    marketplace: primaryOffer?.name || 'Amazon',
    marketplaceUrl: primaryOffer?.url || '#',
    affiliateUrl: primaryOffer?.affiliateUrl || '',
    isAffiliate: Boolean(primaryOffer?.isAffiliate),
    endsIn: 'Limited time',
    status: 'active',
    verified: true,
    isActive: true,
  };
}

// ================= Deal Queries =================
export async function getAllDeals(): Promise<Deal[]> {
  const now = new Date();
  return withDbFallback(
    async () => {
      const docs = await DealModel.find({
        isActive: { $ne: false },
        status: { $ne: 'expired' },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      })
        .populate('product')
        .sort({ discountPercent: -1 })
        .lean();

      const dealDocs = docs.map(mapDeal).filter(isDealCurrentlyActive);
      if (dealDocs.length > 0) {
        return dealDocs;
      }

      // If no dedicated deals exist, surface active products with discounts or deals
      const discountedProducts = await ProductModel.find({
        isActive: { $ne: false },
        $or: [
          { discountPercent: { $gt: 0 } },
          { dealType: { $in: ["Today's Deal", "Sale", "Major Discount", "Flash Deal", "Price Drop", "Featured Deal"] } },
        ],
      })
        .populate('category')
        .sort({ discountPercent: -1 })
        .lean();

      return discountedProducts.map(mapProduct).map(productToDeal);
    },
    () => mockDeals.filter(isDealCurrentlyActive)
  );
}

export async function getDealsByType(dealType: string): Promise<Deal[]> {
  const now = new Date();
  return withDbFallback(
    async () => {
      const docs = await DealModel.find({
        dealType: { $regex: new RegExp(`^${dealType}$`, 'i') },
        isActive: { $ne: false },
        status: { $ne: 'expired' },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      })
        .populate('product')
        .lean();

      const dealDocs = docs.map(mapDeal).filter(isDealCurrentlyActive);
      if (dealDocs.length > 0) {
        return dealDocs;
      }

      // Fallback to active products matching dealType
      const discountedProducts = await ProductModel.find({
        dealType: { $regex: new RegExp(`^${dealType}$`, 'i') },
        isActive: { $ne: false },
      })
        .populate('category')
        .lean();

      return discountedProducts.map(mapProduct).map(productToDeal);
    },
    () =>
      mockDeals
        .filter((d) => d.dealType.toLowerCase() === dealType.toLowerCase())
        .filter(isDealCurrentlyActive)
  );
}

export async function getTodaysDeals(limit = 6): Promise<Deal[]> {
  const now = new Date();
  return withDbFallback(
    async () => {
      const docs = await DealModel.find({
        dealType: "Today's Deal",
        isActive: { $ne: false },
        status: { $ne: 'expired' },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      })
        .populate('product')
        .limit(limit)
        .lean();

      const dealDocs = docs.map(mapDeal).filter(isDealCurrentlyActive);
      if (dealDocs.length > 0) {
        return dealDocs;
      }

      // Fallback: active products with discounts or deals
      const discountedProducts = await ProductModel.find({
        isActive: { $ne: false },
        discountPercent: { $gt: 0 },
      })
        .populate('category')
        .sort({ discountPercent: -1 })
        .limit(limit)
        .lean();

      return discountedProducts.map(mapProduct).map(productToDeal);
    },
    () =>
      mockDeals
        .filter((d) => d.dealType === "Today's Deal")
        .filter(isDealCurrentlyActive)
        .slice(0, limit)
  );
}

export interface PopularDealsResult {
  deals: Deal[];
  isClickPopular: boolean;
  timeWindowDays: number;
}

export async function getPopularDeals(
  options: { limit?: number; days?: number } = {}
): Promise<PopularDealsResult> {
  const limit = Math.max(1, Math.min(20, options.limit || 6));
  const days = Math.max(1, Math.min(90, options.days || 7));
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return withDbFallback(
    async () => {
      // 1. Query AffiliateClick aggregate for clicks on deals in window
      const clickAgg = await AffiliateClickModel.aggregate([
        {
          $match: {
            createdAt: { $gte: sinceDate },
            $or: [
              { dealSlug: { $exists: true, $ne: '' } },
              { deal: { $exists: true, $ne: null } },
            ],
          },
        },
        {
          $group: {
            _id: { $ifNull: ['$dealSlug', '$deal'] },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: limit },
      ]);

      const now = new Date();
      const activeFilter: Record<string, unknown> = {
        isActive: { $ne: false },
        status: { $ne: 'expired' },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      };

      if (clickAgg.length > 0) {
        const dealIdentifiers = clickAgg.map((c) => String(c._id));
        const matchedDeals = await DealModel.find({
          ...activeFilter,
          $or: [
            { slug: { $in: dealIdentifiers } },
            { _id: { $in: dealIdentifiers.filter((id) => /^[0-9a-fA-F]{24}$/.test(id)) } },
          ],
        })
          .populate('product')
          .lean();

        if (matchedDeals.length > 0) {
          const clickMap = new Map(clickAgg.map((c) => [String(c._id), c.clicks]));
          matchedDeals.sort((a, b) => {
            const countA = clickMap.get(a.slug) || clickMap.get(String(a._id)) || 0;
            const countB = clickMap.get(b.slug) || clickMap.get(String(b._id)) || 0;
            return countB - countA;
          });

          return {
            deals: matchedDeals.slice(0, limit).map(mapDeal).filter(isDealCurrentlyActive),
            isClickPopular: true,
            timeWindowDays: days,
          };
        }
      }

      // Fallback: active featured/discounted deals
      const fallbackDocs = await DealModel.find(activeFilter)
        .populate('product')
        .sort({ isFeatured: -1, discountPercent: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      const activeDeals = fallbackDocs.map(mapDeal).filter(isDealCurrentlyActive);
      if (activeDeals.length > 0) {
        return {
          deals: activeDeals,
          isClickPopular: false,
          timeWindowDays: days,
        };
      }

      // If no dedicated deals exist, surface active products with discounts or deals
      const discountedProducts = await ProductModel.find({
        isActive: { $ne: false },
        discountPercent: { $gt: 0 },
      })
        .populate('category')
        .sort({ discountPercent: -1 })
        .limit(limit)
        .lean();

      return {
        deals: discountedProducts.map(mapProduct).map(productToDeal),
        isClickPopular: false,
        timeWindowDays: days,
      };
    },
    () => {
      const active = mockDeals.filter(isDealCurrentlyActive);
      return {
        deals: active.slice(0, limit),
        isClickPopular: false,
        timeWindowDays: days,
      };
    }
  );
}

export async function getExpiringDeals(hours = 72, limit = 6): Promise<Deal[]> {
  const now = new Date();
  const maxEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);

  return withDbFallback(
    async () => {
      const docs = await DealModel.find({
        isActive: { $ne: false },
        status: 'active',
        endDate: { $gt: now, $lte: maxEnd },
      })
        .populate('product')
        .sort({ endDate: 1 })
        .limit(limit)
        .lean();

      return docs.map(mapDeal).filter(isDealCurrentlyActive);
    },
    () => {
      return mockDeals
        .filter((d) => {
          if (!isDealCurrentlyActive(d) || !d.endDate) return false;
          const end = new Date(d.endDate);
          return end > now && end <= maxEnd;
        })
        .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
        .slice(0, limit);
    }
  );
}

export async function getMajorDiscounts(minDiscount = 50): Promise<Product[]> {
  return withDbFallback(
    async () => {
      const docs = await ProductModel.find({
        discountPercent: { $gte: minDiscount },
        isActive: { $ne: false },
      })
        .populate('category')
        .sort({ discountPercent: -1 })
        .lean();
      return docs.map(mapProduct);
    },
    () => mockProducts.filter((p) => p.discountPercent >= minDiscount)
  );
}

export async function getProductsByDiscountRange(range: number, limit = 50): Promise<Product[]> {
  const query: Record<string, unknown> = { isActive: { $ne: false } };
  if (range >= 90) {
    query.discountPercent = { $gte: 90 };
  } else {
    query.discountPercent = { $gte: range, $lt: range + 10 };
  }
  return withDbFallback(
    async () => {
      const docs = await ProductModel.find(query)
        .populate('category')
        .sort({ discountPercent: -1 })
        .limit(limit)
        .lean();
      return docs.map(mapProduct);
    },
    () => mockProducts.filter((p) => matchesDiscountRange(p.discountPercent, range)).slice(0, limit)
  );
}

// ================= Guide Queries =================
export async function getAllGuides(): Promise<Guide[]> {
  return withDbFallback(
    async () => {
      const docs = await GuideModel.find({ isPublished: true })
        .sort({ publishedAt: -1 })
        .lean();
      return docs.map(mapGuide);
    },
    () => mockGuides
  );
}

export async function getGuideBySlug(slug: string): Promise<Guide | undefined> {
  return withDbFallback(
    async () => {
      const doc = await GuideModel.findOne({ slug: slug.toLowerCase(), isPublished: true }).lean();
      return doc ? mapGuide(doc) : undefined;
    },
    () => mockGuides.find((g) => g.slug === slug)
  );
}

export async function getRelatedGuides(
  categorySlug: string,
  limit = 3,
  productSlug?: string
): Promise<Guide[]> {
  const cSlug = (categorySlug || '').trim().toLowerCase();
  const pSlug = (productSlug || '').trim().toLowerCase();

  return withDbFallback(
    async () => {
      const orConditions: Record<string, unknown>[] = [];
      if (pSlug) orConditions.push({ relatedProductSlugs: pSlug });
      if (cSlug) orConditions.push({ categorySlug: cSlug });

      const filter: Record<string, unknown> = {
        isPublished: true,
        ...(orConditions.length > 0 ? { $or: orConditions } : {}),
      };

      const docs = await GuideModel.find(filter)
        .limit(limit)
        .lean();
      return docs.map(mapGuide);
    },
    () =>
      mockGuides
        .filter((g) => {
          if (pSlug && g.relatedProductSlugs?.includes(pSlug)) return true;
          if (cSlug && g.categorySlug === cSlug) return true;
          return false;
        })
        .slice(0, limit)
  );
}

// ================= Review Queries =================
export async function getAllReviews(): Promise<Review[]> {
  return withDbFallback(
    async () => {
      const docs = await ReviewModel.find({ isPublished: true })
        .sort({ publishedAt: -1 })
        .lean();
      return docs.map(mapReview);
    },
    () => mockReviews
  );
}

export async function getReviewBySlug(slug: string): Promise<Review | undefined> {
  return withDbFallback(
    async () => {
      const doc = await ReviewModel.findOne({ slug: slug.toLowerCase(), isPublished: true }).lean();
      return doc ? mapReview(doc) : undefined;
    },
    () => mockReviews.find((r) => r.slug === slug)
  );
}

export async function getRelatedReviews(
  productSlug?: string,
  categorySlug?: string,
  limit = 2
): Promise<Review[]> {
  const pSlug = (productSlug || '').trim().toLowerCase();
  const cSlug = (categorySlug || '').trim().toLowerCase();

  return withDbFallback(
    async () => {
      const filter: Record<string, unknown> = { isPublished: true };
      if (pSlug) {
        filter.productSlug = pSlug;
      }
      let docs = await ReviewModel.find(filter)
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean();

      if (docs.length === 0 && cSlug) {
        const matchingProducts = await ProductModel.find({ categorySlug: cSlug }, { slug: 1 }).lean();
        const slugs = matchingProducts.map((p) => p.slug);
        docs = await ReviewModel.find({ productSlug: { $in: slugs }, isPublished: true })
          .sort({ publishedAt: -1 })
          .limit(limit)
          .lean();
      }

      return docs.map(mapReview);
    },
    () => {
      if (pSlug) {
        const found = mockReviews.filter((r) => r.productSlug.toLowerCase() === pSlug);
        if (found.length > 0) return found.slice(0, limit);
      }
      return mockReviews.slice(0, limit);
    }
  );
}

// ================= Blog Queries =================
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return withDbFallback(
    async () => {
      const docs = await ArticleModel.find({ isPublished: true })
        .sort({ publishedAt: -1 })
        .lean();
      return docs.map(mapBlogPost);
    },
    () => mockBlogPosts
  );
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return withDbFallback(
    async () => {
      const doc = await ArticleModel.findOne({
        slug: slug.toLowerCase(),
        isPublished: true,
      }).lean();
      return doc ? mapBlogPost(doc) : undefined;
    },
    () => mockBlogPosts.find((b) => b.slug === slug)
  );
}

// ================= Comparison Queries =================
export async function getAllComparisons(): Promise<ComparisonItem[]> {
  return withDbFallback(
    async () => {
      const docs = await ComparisonModel.find({ isPublished: { $ne: false } })
        .populate('products')
        .sort({ createdAt: -1 })
        .lean();
      return docs.map(mapComparison);
    },
    () => mockComparisons.filter((c) => c.isPublished !== false)
  );
}

export async function getComparisonBySlug(slug: string): Promise<ComparisonItem | undefined> {
  const normalized = (slug || '').trim().toLowerCase();
  return withDbFallback(
    async () => {
      const doc = await ComparisonModel.findOne({ slug: normalized, isPublished: { $ne: false } })
        .populate('products')
        .lean();
      return doc ? mapComparison(doc) : undefined;
    },
    () => mockComparisons.find((c) => c.slug === normalized)
  );
}

export async function getRelatedComparisons(
  categorySlug?: string,
  productSlug?: string,
  limit = 2
): Promise<ComparisonItem[]> {
  const pSlug = (productSlug || '').trim().toLowerCase();

  return withDbFallback(
    async () => {
      const query: Record<string, unknown> = { isPublished: { $ne: false } };
      if (pSlug) {
        query.productSlugs = pSlug;
      }
      let docs = await ComparisonModel.find(query)
        .populate('products')
        .limit(limit)
        .lean();

      if (docs.length === 0) {
        docs = await ComparisonModel.find({ isPublished: { $ne: false } })
          .populate('products')
          .limit(limit)
          .lean();
      }
      return docs.map(mapComparison);
    },
    () => {
      if (pSlug) {
        const found = mockComparisons.filter((c) => c.productSlugs.includes(pSlug));
        if (found.length > 0) return found.slice(0, limit);
      }
      return mockComparisons.slice(0, limit);
    }
  );
}

export interface RelatedContentResult {
  guides: Guide[];
  reviews: Review[];
  comparisons: ComparisonItem[];
  deals: Deal[];
}

export async function getRelatedContent(params: {
  productSlug?: string;
  categorySlug?: string;
  limit?: number;
}): Promise<RelatedContentResult> {
  const { productSlug, categorySlug, limit = 3 } = params;
  const pSlug = (productSlug || '').trim().toLowerCase();
  const cSlug = (categorySlug || '').trim().toLowerCase();

  const [allGuides, allReviews, allComparisons, allDeals] = await Promise.all([
    getAllGuides(),
    getAllReviews(),
    getAllComparisons(),
    getAllDeals(),
  ]);

  const guides = allGuides
    .filter((g) => {
      if (pSlug && g.relatedProductSlugs?.some((s) => s.toLowerCase() === pSlug)) return true;
      if (cSlug && g.categorySlug.toLowerCase() === cSlug) return true;
      return false;
    })
    .slice(0, limit);

  const reviews = allReviews
    .filter((r) => {
      if (pSlug && r.productSlug.toLowerCase() === pSlug) return true;
      return false;
    })
    .slice(0, limit);

  const comparisons = allComparisons
    .filter((c) => {
      if (pSlug && c.productSlugs.some((s) => s.toLowerCase() === pSlug)) return true;
      return false;
    })
    .slice(0, limit);

  const deals = allDeals
    .filter((d) => {
      if (!isDealCurrentlyActive(d)) return false;
      if (pSlug && (d.product?.slug?.toLowerCase() === pSlug || d.slug?.toLowerCase() === pSlug)) return true;
      if (cSlug && d.product?.categorySlug?.toLowerCase() === cSlug) return true;
      return false;
    })
    .slice(0, limit);

  return {
    guides,
    reviews,
    comparisons,
    deals,
  };
}

// ================= Advanced Search Engine =================
export interface SearchProductOptions {
  q?: string;
  category?: string;
  marketplace?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface SearchProductsResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchEntitiesResult {
  categories: Category[];
  guides: Guide[];
  reviews: Review[];
  blogPosts: BlogPost[];
}

export async function searchProducts(options: SearchProductOptions = {}): Promise<SearchProductsResult> {
  const page = Math.max(1, Math.floor(Number(options.page) || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(Number(options.limit) || 20)));
  const skip = (page - 1) * limit;

  // Sanitize query string (cap length at 100, trim, escape regex special characters)
  const rawQ = (options.q || '').trim().slice(0, 100);
  const safeQ = rawQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const minPrice = typeof options.minPrice === 'number' && !isNaN(options.minPrice) && options.minPrice >= 0 ? options.minPrice : undefined;
  const maxPrice = typeof options.maxPrice === 'number' && !isNaN(options.maxPrice) && options.maxPrice >= 0 ? options.maxPrice : undefined;
  const minDiscount = typeof options.minDiscount === 'number' && !isNaN(options.minDiscount) && options.minDiscount >= 0 ? options.minDiscount : undefined;
  const category = (options.category || '').trim().toLowerCase();
  const marketplace = (options.marketplace || '').trim();
  const sort = (options.sort || 'relevance').toLowerCase();

  return withDbFallback(
    async () => {
      // Build safe MongoDB query object
      const filter: Record<string, unknown> = {
        isActive: { $ne: false },
      };

      if (safeQ) {
        filter.$or = [
          { name: { $regex: safeQ, $options: 'i' } },
          { description: { $regex: safeQ, $options: 'i' } },
          { categorySlug: { $regex: safeQ, $options: 'i' } },
        ];
      }

      if (category) {
        filter.categorySlug = category;
      }

      if (marketplace) {
        filter.marketplaces = {
          $elemMatch: {
            name: new RegExp(`^${marketplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
            isActive: { $ne: false },
            inStock: true,
          },
        };
      }

      if (minPrice !== undefined && maxPrice !== undefined) {
        filter.price = { $gte: minPrice, $lte: maxPrice };
      } else if (minPrice !== undefined) {
        filter.price = { $gte: minPrice };
      } else if (maxPrice !== undefined) {
        filter.price = { $lte: maxPrice };
      }

      if (minDiscount !== undefined) {
        filter.discountPercent = { $gte: minDiscount };
      }

      // Determine deterministic sort order
      let sortObj: Record<string, 1 | -1> = { createdAt: -1, _id: 1 };
      if (sort === 'price_asc' || sort === 'price-asc') {
        sortObj = { price: 1, _id: 1 };
      } else if (sort === 'price_desc' || sort === 'price-desc') {
        sortObj = { price: -1, _id: 1 };
      } else if (sort === 'newest') {
        sortObj = { createdAt: -1, _id: 1 };
      } else if (sort === 'oldest') {
        sortObj = { createdAt: 1, _id: 1 };
      } else if (sort === 'discount_desc' || sort === 'discount-desc') {
        sortObj = { discountPercent: -1, _id: 1 };
      } else if (sort === 'rating_desc' || sort === 'rating-desc') {
        sortObj = { rating: -1, reviewCount: -1, _id: 1 };
      } else {
        // 'relevance' / default: featured items first, then highest rated, then newest
        sortObj = { isFeatured: -1, rating: -1, createdAt: -1, _id: 1 };
      }

      const [total, docs] = await Promise.all([
        ProductModel.countDocuments(filter),
        ProductModel.find(filter)
          .populate('category')
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        products: docs.map(mapProduct),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    },
    () => {
      // Fallback in-memory search across mock products
      let filtered = [...mockProducts];

      if (rawQ) {
        const lowerQ = rawQ.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerQ) ||
            p.description.toLowerCase().includes(lowerQ) ||
            p.category.toLowerCase().includes(lowerQ) ||
            p.categorySlug.toLowerCase().includes(lowerQ)
        );
      }

      if (category) {
        filtered = filtered.filter((p) => p.categorySlug.toLowerCase() === category);
      }

      if (marketplace) {
        filtered = filtered.filter((p) =>
          p.marketplaces?.some(
            (m) =>
              m.name.toLowerCase() === marketplace.toLowerCase() &&
              m.isActive !== false &&
              m.inStock
          )
        );
      }

      if (minPrice !== undefined) {
        filtered = filtered.filter((p) => p.price >= minPrice);
      }
      if (maxPrice !== undefined) {
        filtered = filtered.filter((p) => p.price <= maxPrice);
      }
      if (minDiscount !== undefined) {
        filtered = filtered.filter((p) => p.discountPercent >= minDiscount);
      }

      // Sort
      if (sort === 'price_asc' || sort === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sort === 'price_desc' || sort === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sort === 'discount_desc' || sort === 'discount-desc') {
        filtered.sort((a, b) => b.discountPercent - a.discountPercent);
      } else if (sort === 'rating_desc' || sort === 'rating-desc') {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'newest') {
        filtered.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return 0;
        });
      } else if (sort === 'oldest') {
        const hasCreatedAt = filtered.some((p) => p.createdAt);
        if (hasCreatedAt) {
          filtered.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeA - timeB;
          });
        } else {
          filtered.reverse();
        }
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginated = filtered.slice(skip, skip + limit);

      return {
        products: paginated,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    }
  );
}

export async function searchEntities(q: string): Promise<SearchEntitiesResult> {
  const rawQ = (q || '').trim().slice(0, 100);
  if (!rawQ) {
    return {
      categories: [],
      guides: [],
      reviews: [],
      blogPosts: [],
    };
  }

  const safeQ = rawQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return withDbFallback(
    async () => {
      const regex = { $regex: safeQ, $options: 'i' };

      const [catDocs, guideDocs, reviewDocs, blogDocs] = await Promise.all([
        CategoryModel.find({
          isActive: { $ne: false },
          $or: [{ name: regex }, { description: regex }],
        })
          .limit(4)
          .lean(),
        GuideModel.find({
          isPublished: true,
          $or: [{ title: regex }, { excerpt: regex }, { category: regex }],
        })
          .limit(4)
          .lean(),
        ReviewModel.find({
          isPublished: true,
          $or: [{ title: regex }, { productName: regex }, { verdict: regex }],
        })
          .limit(4)
          .lean(),
        ArticleModel.find({
          isPublished: true,
          $or: [{ title: regex }, { excerpt: regex }, { category: regex }],
        })
          .limit(4)
          .lean(),
      ]);

      return {
        categories: catDocs.map(mapCategory),
        guides: guideDocs.map(mapGuide),
        reviews: reviewDocs.map(mapReview),
        blogPosts: blogDocs.map(mapBlogPost),
      };
    },
    () => {
      const lowerQ = rawQ.toLowerCase();
      return {
        categories: mockCategories
          .filter((c) => c.name.toLowerCase().includes(lowerQ) || c.description.toLowerCase().includes(lowerQ))
          .slice(0, 4),
        guides: mockGuides
          .filter((g) => g.title.toLowerCase().includes(lowerQ) || g.excerpt.toLowerCase().includes(lowerQ))
          .slice(0, 4),
        reviews: mockReviews
          .filter((r) => r.title.toLowerCase().includes(lowerQ) || r.productName.toLowerCase().includes(lowerQ))
          .slice(0, 4),
        blogPosts: mockBlogPosts
          .filter((b) => b.title.toLowerCase().includes(lowerQ) || b.excerpt.toLowerCase().includes(lowerQ))
          .slice(0, 4),
      };
    }
  );
}

/**
 * Retrieve active hero banners for homepage background carousel (max 5).
 * Sorted by displayOrder ascending, then createdAt descending.
 */
export async function getActiveHeroBanners(limit: number = 5): Promise<HeroBanner[]> {
  return withDbFallback(
    async () => {
      const banners = await HeroBannerModel.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .limit(limit)
        .lean();

      return banners.map((b: {
        _id: { toString(): string };
        title: string;
        imageUrl: string;
        linkUrl?: string;
        isActive?: boolean;
        displayOrder?: number;
        createdAt?: Date | string;
        updatedAt?: Date | string;
      }) => ({
        id: b._id.toString(),
        _id: b._id.toString(),
        title: b.title,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl || '',
        isActive: Boolean(b.isActive),
        displayOrder: b.displayOrder ?? 0,
        createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : undefined,
        updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : undefined,
      }));
    },
    () => []
  );
}

/**
 * Retrieve aggregated discovery data for the homepage:
 * 1. 50%+ Off Categories (only categories with active products having discountPercent >= 50, sorted by product count desc)
 * 2. Budget Tiers (Under ₹299, ₹399, ₹499, ₹599, ₹699, ₹799, ₹899 where count > 0, ascending)
 * 3. Shop by Category (all active admin-created categories)
 */
export async function getHomepageDiscoveryData(): Promise<HomepageDiscoveryData> {
  return withDbFallback(
    async () => {
      // 1. Fetch active categories
      const activeCategories = await CategoryModel.find({ isActive: true })
        .sort({ featured: -1, itemCount: -1, name: 1 })
        .lean();

      type CategoryDoc = {
        _id: { toString(): string };
        name: string;
        slug: string;
        icon?: string;
        iconKey?: string;
        image?: string;
        imageUrl?: string;
        itemCount?: number;
      };

      const activeCategoryMap = new Map<string, CategoryDoc>(
        (activeCategories as unknown as CategoryDoc[]).map((c) => [c.slug.toLowerCase(), c])
      );

      // 2. Aggregate 50%+ Off categories with product counts and representative image
      const discount50Agg = await ProductModel.aggregate([
        {
          $match: {
            isActive: true,
            discountPercent: { $gte: 50, $lte: 100 },
          },
        },
        {
          $sort: { discountPercent: -1, createdAt: -1 },
        },
        {
          $group: {
            _id: { $toLower: '$categorySlug' },
            count: { $sum: 1 },
            sampleImage: { $first: '$image' },
            sampleTitle: { $first: '$name' },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      const discountCategories: DiscountCategoryItem[] = [];
      for (const item of discount50Agg) {
        const cat = activeCategoryMap.get(item._id);
        if (cat && item.count > 0) {
          const catImg = cat.imageUrl || cat.image || '';
          const catIco = cat.iconKey || cat.icon || 'Tv';
          discountCategories.push({
            slug: cat.slug,
            name: cat.name,
            count: item.count,
            image: item.sampleImage || catImg,
            icon: catIco,
          });
        }
      }

      // 3. Aggregate budget counts in a single query
      const budgetCountsAgg = await ProductModel.aggregate([
        {
          $match: {
            isActive: true,
            price: { $lt: 899 },
          },
        },
        {
          $group: {
            _id: null,
            under299: { $sum: { $cond: [{ $lt: ['$price', 299] }, 1, 0] } },
            under399: { $sum: { $cond: [{ $lt: ['$price', 399] }, 1, 0] } },
            under499: { $sum: { $cond: [{ $lt: ['$price', 499] }, 1, 0] } },
            under599: { $sum: { $cond: [{ $lt: ['$price', 599] }, 1, 0] } },
            under699: { $sum: { $cond: [{ $lt: ['$price', 699] }, 1, 0] } },
            under799: { $sum: { $cond: [{ $lt: ['$price', 799] }, 1, 0] } },
            under899: { $sum: { $cond: [{ $lt: ['$price', 899] }, 1, 0] } },
          },
        },
      ]);

      const counts = (budgetCountsAgg[0] || {}) as Record<string, number>;
      const budgetTiersRaw = [
        { amount: 299, count: counts.under299 || 0 },
        { amount: 399, count: counts.under399 || 0 },
        { amount: 499, count: counts.under499 || 0 },
        { amount: 599, count: counts.under599 || 0 },
        { amount: 699, count: counts.under699 || 0 },
        { amount: 799, count: counts.under799 || 0 },
        { amount: 899, count: counts.under899 || 0 },
      ];

      const budgetTiers: BudgetTierItem[] = budgetTiersRaw
        .filter((t) => t.count > 0)
        .map((t) => ({
          label: `Under ₹${t.amount}`,
          amount: t.amount,
          count: t.count,
          href: `/products?maxPrice=${t.amount}`,
        }));

      // 4. All active categories
      const categories: DiscoveryCategoryItem[] = (activeCategories as unknown as CategoryDoc[]).map((c) => ({
        id: c._id.toString(),
        slug: c.slug,
        name: c.name,
        image: c.imageUrl || c.image || '',
        icon: c.iconKey || c.icon || 'Tv',
        itemCount: c.itemCount || 0,
      }));

      return {
        discountCategories,
        budgetTiers,
        categories,
      };
    },
    // Mock fallback when DB is disconnected
    () => {
      // Qualifying mock products with discount >= 50
      const qualifyingProducts = mockProducts.filter((p) => p.discountPercent >= 50);
      const catCountMap = new Map<string, { count: number; sampleImage: string }>();
      for (const p of qualifyingProducts) {
        const slug = (p.categorySlug || p.category).toLowerCase();
        const existing = catCountMap.get(slug);
        if (existing) {
          existing.count++;
        } else {
          catCountMap.set(slug, { count: 1, sampleImage: p.image });
        }
      }

      const discountCategories: DiscountCategoryItem[] = [];
      for (const cat of mockCategories) {
        const info = catCountMap.get(cat.slug.toLowerCase());
        if (info && info.count > 0) {
          const catImg = cat.imageUrl || cat.image || '';
          const catIco = cat.iconKey || cat.icon || 'Tv';
          discountCategories.push({
            slug: cat.slug,
            name: cat.name,
            count: info.count,
            image: info.sampleImage || catImg,
            icon: catIco,
          });
        }
      }
      discountCategories.sort((a, b) => b.count - a.count);

      const budgetTiersRaw = [
        { amount: 299, count: mockProducts.filter((p) => p.price < 299).length },
        { amount: 399, count: mockProducts.filter((p) => p.price < 399).length },
        { amount: 499, count: mockProducts.filter((p) => p.price < 499).length },
        { amount: 599, count: mockProducts.filter((p) => p.price < 599).length },
        { amount: 699, count: mockProducts.filter((p) => p.price < 699).length },
        { amount: 799, count: mockProducts.filter((p) => p.price < 799).length },
        { amount: 899, count: mockProducts.filter((p) => p.price < 899).length },
      ];

      const budgetTiers: BudgetTierItem[] = budgetTiersRaw
        .filter((t) => t.count > 0)
        .map((t) => ({
          label: `Under ₹${t.amount}`,
          amount: t.amount,
          count: t.count,
          href: `/products?maxPrice=${t.amount}`,
        }));

      const categories: DiscoveryCategoryItem[] = mockCategories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        image: c.imageUrl || c.image || '',
        icon: c.iconKey || c.icon || 'Tv',
        itemCount: c.itemCount || 0,
      }));

      return {
        discountCategories,
        budgetTiers,
        categories,
      };
    }
  );
}

// Re-export client-safe Filter & Sort Engine
export { filterAndSortProducts } from '@/lib/filter-utils';
