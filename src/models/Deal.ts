import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { MarketplaceName, DealType } from '@/types';

export interface IDeal extends Document {
  title: string;
  slug: string;
  description: string;
  product?: Types.ObjectId;
  productSlug: string;
  image: string;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  marketplace: MarketplaceName;
  marketplaceUrl: string;
  affiliateUrl?: string;
  isAffiliate?: boolean;
  dealType: DealType;
  endsIn: string;
  startDate?: Date;
  endDate?: Date;
  status: 'active' | 'expired' | 'upcoming' | 'inactive';
  isFeatured: boolean;
  verified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    title: {
      type: String,
      required: [true, 'Deal title is required'],
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
    image: {
      type: String,
      default: '',
      trim: true,
    },
    currentPrice: {
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
      index: true,
    },
    marketplace: {
      type: String,
      enum: ['Amazon', 'Flipkart', 'Myntra', 'AJIO', 'Meesho'],
      default: 'Amazon',
      index: true,
    },
    marketplaceUrl: {
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
    dealType: {
      type: String,
      enum: ['Regular', "Today's Deal", 'Sale', 'Major Discount', 'Flash Deal', 'Price Drop', 'Featured Deal'],
      default: "Today's Deal",
      index: true,
    },
    endsIn: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'upcoming', 'inactive'],
      default: 'active',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    verified: {
      type: Boolean,
      default: true,
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

// Compound indexes for deal discovery queries
DealSchema.index({ isActive: 1, status: 1, endDate: 1 });
DealSchema.index({ isActive: 1, isFeatured: -1, discountPercent: -1 });

DealSchema.pre('save', function () {
  if (this.originalPrice > this.currentPrice && this.originalPrice > 0) {
    this.discountPercent = Math.round(((this.originalPrice - this.currentPrice) / this.originalPrice) * 100);
  }
  if (this.isActive === false) {
    this.status = 'inactive';
  } else {
    const now = new Date();
    if (this.startDate && now < new Date(this.startDate)) {
      this.status = 'upcoming';
    } else if (this.endDate && now > new Date(this.endDate)) {
      this.status = 'expired';
    } else {
      this.status = 'active';
    }
  }
});

export const Deal: Model<IDeal> =
  (mongoose.models.Deal as Model<IDeal>) ||
  mongoose.model<IDeal>('Deal', DealSchema);

export default Deal;
