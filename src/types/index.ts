export type MarketplaceName = 'Amazon' | 'Flipkart' | 'Myntra' | 'AJIO' | 'Meesho';

export type DealType =
  | 'Regular'
  | "Today's Deal"
  | 'Sale'
  | 'Major Discount'
  | 'Flash Deal'
  | 'Price Drop'
  | 'Featured Deal';

export interface MarketplaceOffer {
  name: MarketplaceName;
  price: number | null; // null if not available
  originalPrice?: number;
  url: string;
  affiliateUrl?: string;
  isAffiliate?: boolean;
  isActive?: boolean;
  inStock: boolean;
  lastUpdated?: string | Date;
  externalProductId?: string;
  couponCode?: string;
  couponText?: string;
  dealBadge?: string;
  deliveryInfo?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  images?: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  category: string;
  categorySlug: string;
  pros: string[];
  cons: string[];
  specifications: Record<string, string>;
  marketplaces: MarketplaceOffer[];
  dealType: DealType;
  featured?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  trending?: boolean;
  badgeText?: string;
  tags?: string[];
  source?: 'manual' | 'csv_import';
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  itemCount: number;
  image?: string;
  featured?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

export interface DiscountCategoryItem {
  slug: string;
  name: string;
  count: number;
  image?: string;
  icon?: string;
}

export interface BudgetTierItem {
  label: string;
  amount: number;
  count: number;
  href: string;
}

export interface DiscoveryCategoryItem {
  id: string;
  slug: string;
  name: string;
  image?: string;
  icon?: string;
  itemCount: number;
}

export interface HomepageDiscoveryData {
  discountCategories: DiscountCategoryItem[];
  budgetTiers: BudgetTierItem[];
  categories: DiscoveryCategoryItem[];
}

export interface HeroBanner {
  id?: string;
  _id?: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Deal {
  id: string;
  title: string;
  slug: string;
  product: Product;
  dealType: DealType;
  discountPercent: number;
  marketplace: MarketplaceName;
  marketplaceUrl?: string;
  affiliateUrl?: string;
  isAffiliate?: boolean;
  endsIn?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: 'active' | 'upcoming' | 'expired' | 'inactive';
  verified: boolean;
  isActive?: boolean;
}

export interface GuideTopPick {
  title: string;
  subtitle: string;
  price: number;
  productSlug?: string;
  whyBuy: string;
}

export interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  categorySlug: string;
  readTime: string;
  updatedAt: string;
  author: string;
  image: string;
  topPicks: GuideTopPick[];
  comparisonTable: {
    headers: string[];
    rows: string[][];
  };
  pros: string[];
  cons: string[];
  buyingTips: string[];
  relatedProductSlugs: string[];
}

export interface Review {
  id: string;
  title: string;
  slug: string;
  productSlug: string;
  productName: string;
  image: string;
  rating: number;
  verdict: string;
  pros: string[];
  cons: string[];
  specifications: Record<string, string>;
  price: number;
  originalPrice: number;
  discountPercent: number;
  marketplaces: MarketplaceOffer[];
  date: string;
  author: string;
  isEditorial?: boolean;
  categorySlug?: string;
  publishedAt?: string | Date;
}

export interface ComparisonItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  products?: Product[];
  productSlugs: string[];
  content: string;
  image: string;
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
}

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  maxPriceExclusive?: boolean;
  minDiscount?: number;
  discountRange?: number;
  discountMin?: number;
  discountMax?: number;
  dealType?: string;
  marketplace?: string;
  rating?: number;
  searchQuery?: string;
}

export type SortOption =
  | 'popular'
  | 'price-asc'
  | 'price-desc'
  | 'discount-desc'
  | 'newest'
  | 'oldest'
  | 'rating-desc';
