import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import { Comparison, IComparison } from '@/models/Comparison';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ComparisonForm, ComparisonFormData } from '@/components/admin/ComparisonForm';
import { isValidId } from '@/lib/api-helpers';

interface EditComparisonProps {
  params: Promise<{ id: string }>;
}

export default async function EditComparisonPage({ params }: EditComparisonProps) {
  const { id } = await params;
  await connectToDatabase();

  const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
  const comparison = await Comparison.findOne(query).lean<IComparison>();

  if (!comparison) {
    notFound();
  }

  const initialData: ComparisonFormData = {
    _id: String(comparison._id),
    title: comparison.title,
    slug: comparison.slug,
    description: comparison.description || '',
    products: Array.isArray(comparison.products)
      ? comparison.products.map((p: unknown) => String(p))
      : [],
    productSlugs: comparison.productSlugs || [],
    content: comparison.content || '',
    image: comparison.image || '',
    isPublished: comparison.isPublished !== false,
    seoTitle: comparison.seoTitle || '',
    seoDescription: comparison.seoDescription || '',
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Edit Comparison: ${comparison.title}`}
        subtitle={`ID: ${comparison._id}`}
      />
      <ComparisonForm initialData={initialData} isEdit={true} />
    </div>
  );
}
