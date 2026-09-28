import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { isValidId } from '@/lib/api-helpers';

interface EditCategoryProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryProps) {
  const { id } = await params;
  await connectToDatabase();

  const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
  const category = await Category.findOne(query).lean();

  if (!category) {
    notFound();
  }

  const initialData = {
    _id: String(category._id),
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    description: category.description,
    image: category.image,
    itemCount: category.itemCount,
    featured: category.featured,
    isActive: category.isActive,
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Edit Category: ${category.name}`}
        subtitle={`ID: ${category._id}`}
      />
      <CategoryForm initialData={initialData} isEdit={true} />
    </div>
  );
}
