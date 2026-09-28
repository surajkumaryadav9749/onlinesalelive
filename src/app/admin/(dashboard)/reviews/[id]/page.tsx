import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import { Review, IReview } from '@/models/Review';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ReviewForm, ReviewFormData } from '@/components/admin/ReviewForm';
import { isValidId } from '@/lib/api-helpers';

interface EditReviewProps {
  params: Promise<{ id: string }>;
}

export default async function EditReviewPage({ params }: EditReviewProps) {
  const { id } = await params;
  await connectToDatabase();

  const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
  const review = await Review.findOne(query).lean<IReview>();

  if (!review) {
    notFound();
  }

  const initialData: ReviewFormData = {
    _id: String(review._id),
    title: review.title,
    slug: review.slug,
    excerpt: review.excerpt || '',
    content: review.content || '',
    product: review.product ? String(review.product) : '',
    productName: review.productName || '',
    productSlug: review.productSlug || '',
    image: review.image || '',
    rating: review.rating || 4.5,
    verdict: review.verdict || '',
    pros: review.pros || [],
    cons: review.cons || [],
    price: review.price || '',
    originalPrice: review.originalPrice || '',
    discountPercent: review.discountPercent || '',
    author: review.author || 'Editorial Team',
    isPublished: review.isPublished !== false,
    seoTitle: review.seoTitle || '',
    seoDescription: review.seoDescription || '',
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Edit Review: ${review.title}`}
        subtitle={`ID: ${review._id} • ${review.productName || 'Review'}`}
      />
      <ReviewForm initialData={initialData} isEdit={true} />
    </div>
  );
}
