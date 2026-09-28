import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { MarketplaceName } from '@/types';

export interface IAffiliateClick extends Document {
  product?: Types.ObjectId;
  productSlug?: string;
  productName?: string;
  deal?: Types.ObjectId;
  dealSlug?: string;
  marketplace: MarketplaceName;
  destinationUrl: string;
  isAffiliate: boolean;
  sourcePage?: string;
  referrer?: string;
  userAgent?: string;
  createdAt: Date;
}

const AffiliateClickSchema = new Schema<IAffiliateClick>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    productSlug: {
      type: String,
      trim: true,
      index: true,
    },
    productName: {
      type: String,
      trim: true,
    },
    deal: {
      type: Schema.Types.ObjectId,
      ref: 'Deal',
      index: true,
    },
    dealSlug: {
      type: String,
      trim: true,
    },
    marketplace: {
      type: String,
      enum: ['Amazon', 'Flipkart', 'Myntra', 'AJIO', 'Meesho'],
      required: true,
      index: true,
    },
    destinationUrl: {
      type: String,
      required: true,
      trim: true,
    },
    isAffiliate: {
      type: Boolean,
      default: false,
    },
    sourcePage: {
      type: String,
      trim: true,
      default: '',
    },
    referrer: {
      type: String,
      trim: true,
      default: '',
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound indexes for analytics performance
AffiliateClickSchema.index({ marketplace: 1, createdAt: -1 });
AffiliateClickSchema.index({ productSlug: 1, createdAt: -1 });
AffiliateClickSchema.index({ dealSlug: 1, createdAt: -1 });
AffiliateClickSchema.index({ createdAt: -1 });

export const AffiliateClick: Model<IAffiliateClick> =
  (mongoose.models.AffiliateClick as Model<IAffiliateClick>) ||
  mongoose.model<IAffiliateClick>('AffiliateClick', AffiliateClickSchema);

export default AffiliateClick;
