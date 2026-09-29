import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHeroBanner extends Document {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeroBannerSchema = new Schema<IHeroBanner>(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      maxlength: [120, 'Banner title cannot exceed 120 characters'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image URL is required'],
      trim: true,
    },
    linkUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch latest active banners sorted by order and creation
HeroBannerSchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });

export const HeroBanner: Model<IHeroBanner> =
  (mongoose.models.HeroBanner as Model<IHeroBanner>) ||
  mongoose.model<IHeroBanner>('HeroBanner', HeroBannerSchema);

export default HeroBanner;
