import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategoryImage extends Document {
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
  categorySlug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategoryImageSchema = new Schema<ICategoryImage>(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: 'image/png',
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
    categorySlug: {
      type: String,
      default: '',
      index: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CategoryImage: Model<ICategoryImage> =
  (mongoose.models.CategoryImage as Model<ICategoryImage>) ||
  mongoose.model<ICategoryImage>('CategoryImage', CategoryImageSchema);

export default CategoryImage;
