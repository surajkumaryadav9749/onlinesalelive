import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHeroBannerImage extends Document {
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const HeroBannerImageSchema = new Schema<IHeroBannerImage>(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: 'image/webp',
    },
    size: {
      type: Number,
      required: true,
      default: 0,
    },
    data: {
      type: Buffer,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const HeroBannerImage: Model<IHeroBannerImage> =
  (mongoose.models.HeroBannerImage as Model<IHeroBannerImage>) ||
  mongoose.model<IHeroBannerImage>('HeroBannerImage', HeroBannerImageSchema);

export default HeroBannerImage;
