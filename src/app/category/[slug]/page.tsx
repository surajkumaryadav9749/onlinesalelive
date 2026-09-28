import React from 'react';
import { notFound } from 'next/navigation';
import {
  getAllCategories,
  getCategoryBySlug,
  getProductsByCategory,
  getRelatedContent,
} from '@/lib/data-service';
import { CategoryPageClient } from './CategoryPageClient';
import type { Metadata } from 'next';

import { createCategoryMetadata } from '@/lib/seo';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found | OnlineSaleLive',
      robots: { index: false, follow: false },
    };
  }

  return createCategoryMetadata(category);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [products, relatedContent] = await Promise.all([
    getProductsByCategory(slug),
    getRelatedContent({ categorySlug: slug, limit: 3 }),
  ]);

  return (
    <CategoryPageClient
      category={category}
      initialProducts={products}
      relatedContent={relatedContent}
    />
  );
}
