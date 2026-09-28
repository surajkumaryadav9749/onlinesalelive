import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import { Guide, IGuide } from '@/models/Guide';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { GuideForm, GuideFormData } from '@/components/admin/GuideForm';
import { isValidId } from '@/lib/api-helpers';

interface EditGuideProps {
  params: Promise<{ id: string }>;
}

export default async function EditGuidePage({ params }: EditGuideProps) {
  const { id } = await params;
  await connectToDatabase();

  const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
  const guide = await Guide.findOne(query).lean<IGuide>();

  if (!guide) {
    notFound();
  }

  const initialData: GuideFormData = {
    _id: String(guide._id),
    title: guide.title,
    slug: guide.slug,
    excerpt: guide.excerpt || '',
    content: guide.content || '',
    category: guide.category || '',
    categorySlug: guide.categorySlug || '',
    author: guide.author || 'Editorial Team',
    readTime: guide.readTime || '8 min read',
    image: guide.image || '',
    buyingTips: guide.buyingTips || [],
    pros: guide.pros || [],
    cons: guide.cons || [],
    isPublished: guide.isPublished !== false,
    seoTitle: guide.seoTitle || '',
    seoDescription: guide.seoDescription || '',
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Edit Guide: ${guide.title}`}
        subtitle={`ID: ${guide._id} • ${guide.category}`}
      />
      <GuideForm initialData={initialData} isEdit={true} />
    </div>
  );
}
