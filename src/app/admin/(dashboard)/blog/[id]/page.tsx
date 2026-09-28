import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import { Article, IArticle } from '@/models/Article';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ArticleForm, ArticleFormData } from '@/components/admin/ArticleForm';
import { isValidId } from '@/lib/api-helpers';

interface EditArticleProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: EditArticleProps) {
  const { id } = await params;
  await connectToDatabase();

  const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
  const article = await Article.findOne(query).lean<IArticle>();

  if (!article) {
    notFound();
  }

  const initialData: ArticleFormData = {
    _id: String(article._id),
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || '',
    content: article.content || '',
    image: article.image || '',
    category: article.category || 'Shopping Tips',
    author: article.author || 'Deals Intelligence Team',
    readTime: article.readTime || '5 min read',
    isPublished: article.isPublished !== false,
    seoTitle: article.seoTitle || '',
    seoDescription: article.seoDescription || '',
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Edit Article: ${article.title}`}
        subtitle={`ID: ${article._id} • ${article.category}`}
      />
      <ArticleForm initialData={initialData} isEdit={true} />
    </div>
  );
}
