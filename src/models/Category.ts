import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  iconKey?: string;
  description: string;
  itemCount: number;
  image: string;
  imageUrl?: string;
  featured: boolean;
  isActive: boolean;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
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
    icon: {
      type: String,
      default: 'Tv',
      trim: true,
    },
    iconKey: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    itemCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
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

CategorySchema.pre('validate', function () {
  // Sync image and imageUrl
  if (this.isModified('imageUrl') && !this.isModified('image')) {
    this.image = this.imageUrl || '';
  } else if (this.isModified('image') && !this.isModified('imageUrl')) {
    this.imageUrl = this.image || '';
  } else if (this.imageUrl && !this.image) {
    this.image = this.imageUrl;
  } else if (this.image && !this.imageUrl) {
    this.imageUrl = this.image;
  }

  // Sync icon and iconKey
  if (this.isModified('iconKey') && !this.isModified('icon')) {
    this.icon = this.iconKey || 'Tv';
  } else if (this.isModified('icon') && !this.isModified('iconKey')) {
    this.iconKey = this.icon || '';
  } else if (this.iconKey && !this.icon) {
    this.icon = this.iconKey;
  } else if (this.icon && !this.iconKey) {
    this.iconKey = this.icon;
  }
});

export const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory>) ||
  mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
