import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IComparison extends Document {
  title: string;
  slug: string;
  description: string;
  products: Types.ObjectId[];
  productSlugs: string[];
  content: string;
  image: string;
  isPublished: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComparisonSchema = new Schema<IComparison>(
  {
    title: {
      type: String,
      required: [true, 'Comparison title is required'],
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
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    productSlugs: {
      type: [String],
      default: [],
    },
    content: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
      trim: true,
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

// Indexes for public lookup
ComparisonSchema.index({ isPublished: 1, createdAt: -1 });
ComparisonSchema.index({ productSlugs: 1 });

export const Comparison: Model<IComparison> =
  (mongoose.models.Comparison as Model<IComparison>) ||
  mongoose.model<IComparison>('Comparison', ComparisonSchema);

export default Comparison;
