import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IMarketplaceOffer, MarketplaceOfferSchema } from './Product';

export interface IReview extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  product?: Types.ObjectId;
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
  marketplaces: IMarketplaceOffer[];
  author: string;
  publishedAt: Date;
  isPublished: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    title: {
      type: String,
      required: [true, 'Review title is required'],
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
    excerpt: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    productSlug: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    productName: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    verdict: {
      type: String,
      default: '',
      trim: true,
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
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    marketplaces: {
      type: [MarketplaceOfferSchema],
      default: [],
    },
    author: {
      type: String,
      default: 'Review Desk',
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Review: Model<IReview> =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
