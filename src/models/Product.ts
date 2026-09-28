import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { MarketplaceName, DealType } from '@/types';

export interface IMarketplaceOffer {
  name: MarketplaceName;
  price: number | null;
  originalPrice?: number;
  url: string;
  affiliateUrl?: string;
  isAffiliate?: boolean;
  isActive?: boolean;
  inStock: boolean;
  lastUpdated?: Date;
  externalProductId?: string;
  couponCode?: string;
  couponText?: string;
  dealBadge?: string;
  deliveryInfo?: string;
  notes?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  image: string;
  images: string[];
  category: Types.ObjectId;
  categorySlug: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  pros: string[];
  cons: string[];
  specifications: Record<string, string>;
  marketplaces: IMarketplaceOffer[];
  dealType: DealType;
  dealStart?: Date;
  dealEnd?: Date;
  dealStatus: 'active' | 'upcoming' | 'expired';
  isFeatured: boolean;
  isTrending: boolean;
  badgeText?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const MarketplaceOfferSchema = new Schema<IMarketplaceOffer>(
  {
    name: {
      type: String,
      enum: ['Amazon', 'Flipkart', 'Myntra', 'AJIO', 'Meesho'],
      required: true,
    },
    price: {
      type: Number,
      default: null,
    },
    originalPrice: {
      type: Number,
    },
    url: {
      type: String,
      default: '#',
    },
    affiliateUrl: {
      type: String,
      default: '',
    },
    isAffiliate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    externalProductId: {
      type: String,
    },
    couponCode: {
      type: String,
    },
    couponText: {
      type: String,
    },
    dealBadge: {
      type: String,
    },
    deliveryInfo: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    categorySlug: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
      index: true,
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    rating: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pros: {
      type: [String],
      default: [],
    },
    cons: {
      type: [String],
      default: [],
    },
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
    marketplaces: {
      type: [MarketplaceOfferSchema],
      default: [],
    },
    dealType: {
      type: String,
      enum: ["Today's Deal", 'Sale', 'Major Discount', 'Flash Deal', 'Price Drop', 'Featured Deal'],
      default: "Today's Deal",
      index: true,
    },
    dealStart: {
      type: Date,
    },
    dealEnd: {
      type: Date,
    },
    dealStatus: {
      type: String,
      enum: ['active', 'upcoming', 'expired'],
      default: 'active',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    badgeText: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for Search & Filter Performance
ProductSchema.index(
  { name: 'text', description: 'text' },
  { weights: { name: 10, description: 2 }, name: 'ProductTextSearchIndex' }
);
ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, price: 1 });
ProductSchema.index({ isActive: 1, categorySlug: 1 });
ProductSchema.index({ isActive: 1, discountPercent: -1 });

export const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
