import mongoose, { Schema, Document, Model } from 'mongoose';
import { MarketplaceName } from '@/types';

export interface IAffiliateReport extends Document {
  marketplace: MarketplaceName;
  trackingId: string;
  date: Date;
  dateString: string; // YYYY-MM-DD for fast string queries
  asin?: string;
  productSlug?: string;
  productName?: string;
  category?: string;
  clicks: number;
  orderedItems: number;
  shippedItems: number;
  returnedItems: number;
  sales: number; // in INR
  earnings: number; // in INR
  conversionRate: number; // percentage (0 - 100)
  source: 'imported_report' | 'api_sync';
  rawReportName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateReportSchema = new Schema<IAffiliateReport>(
  {
    marketplace: {
      type: String,
      enum: ['Amazon', 'Flipkart', 'Myntra', 'AJIO', 'Meesho'],
      default: 'Amazon',
      required: true,
      index: true,
    },
    trackingId: {
      type: String,
      trim: true,
      default: 'default',
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    dateString: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    asin: {
      type: String,
      trim: true,
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
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderedItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippedItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    returnedItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    sales: {
      type: Number,
      default: 0,
      min: 0,
    },
    earnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: ['imported_report', 'api_sync'],
      default: 'imported_report',
    },
    rawReportName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics queries
AffiliateReportSchema.index({ marketplace: 1, date: -1 });
AffiliateReportSchema.index({ marketplace: 1, trackingId: 1, date: -1 });
AffiliateReportSchema.index({ marketplace: 1, dateString: 1 });
AffiliateReportSchema.index({ productSlug: 1, date: -1 });
AffiliateReportSchema.index({ asin: 1, date: -1 });

export const AffiliateReport: Model<IAffiliateReport> =
  (mongoose.models.AffiliateReport as Model<IAffiliateReport>) ||
  mongoose.model<IAffiliateReport>('AffiliateReport', AffiliateReportSchema);

export default AffiliateReport;
