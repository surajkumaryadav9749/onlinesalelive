import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import { Product, IProduct, IMarketplaceOffer } from '@/models/Product';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProductForm, ProductFormData } from '@/components/admin/ProductForm';
import { isValidId } from '@/lib/api-helpers';

interface EditProductProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductProps) {
  const { id } = await params;
  await connectToDatabase();

  const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
  const product = await Product.findOne(query).lean<IProduct>();

  if (!product) {
    notFound();
  }

  const initialData: ProductFormData = {
    _id: String(product._id),
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    image: product.image || '',
    images: Array.isArray(product.images) ? product.images : [product.image].filter(Boolean),
    category: String(product.category),
    categorySlug: product.categorySlug || '',
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercent: product.discountPercent,
    rating: product.rating || 4.5,
    reviewCount: product.reviewCount || 0,
    pros: product.pros || [],
    cons: product.cons || [],
    specifications: product.specifications || {},
    marketplaces: Array.isArray(product.marketplaces)
      ? product.marketplaces.map((m: IMarketplaceOffer) => ({
          name: m.name,
          price: m.price ?? '',
          originalPrice: m.originalPrice ?? '',
          url: m.url || '',
          inStock: m.inStock !== false,
          dealBadge: m.dealBadge || '',
          deliveryInfo: m.deliveryInfo || '',
        }))
      : [],
    dealType: product.dealType || "Today's Deal",
    dealStatus: product.dealStatus || 'active',
    isFeatured: Boolean(product.isFeatured),
    isTrending: Boolean(product.isTrending),
    badgeText: product.badgeText || '',
    isActive: product.isActive !== false,
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Edit Product: ${product.name}`}
        subtitle={`ID: ${product._id} • ${product.categorySlug}`}
      />
      <ProductForm initialData={initialData} isEdit={true} />
    </div>
  );
}
