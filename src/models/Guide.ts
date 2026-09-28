import mongoose, { Schema, Document, Model } from 'mongoose';
import { GuideTopPick } from '@/types';

export interface IGuide extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  categorySlug: string;
  readTime: string;
  publishedAt: Date;
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
  isPublished: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GuideTopPickSchema = new Schema<GuideTopPick>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    price: { type: Number, required: true },
    productSlug: { type: String },
    whyBuy: { type: String, default: '' },
  },
  { _id: false }
);

const GuideSchema = new Schema<IGuide>(
  {
    title: {
      type: String,
      required: [true, 'Guide title is required'],
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
    category: {
      type: String,
      default: '',
      trim: true,
    },
    categorySlug: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      index: true,
    },
    readTime: {
      type: String,
      default: '6 min read',
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    author: {
      type: String,
      default: 'Editorial Staff',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    topPicks: {
      type: [GuideTopPickSchema],
      default: [],
    },
    comparisonTable: {
      headers: { type: [String], default: [] },
      rows: { type: [[String]], default: [] },
    },
    pros: {
      type: [String],
      default: [],
    },
    cons: {
      type: [String],
      default: [],
    },
    buyingTips: {
      type: [String],
      default: [],
    },
    relatedProductSlugs: {
      type: [String],
      default: [],
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

export const Guide: Model<IGuide> =
  (mongoose.models.Guide as Model<IGuide>) ||
  mongoose.model<IGuide>('Guide', GuideSchema);

export default Guide;
