import React from 'react';
import { ArticleForm } from '@/components/admin/ArticleForm';

export const metadata = {
  title: 'Write Article | Admin CMS',
};

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Write New Article</h1>
        <p className="text-slate-500 text-sm mt-1">
          Publish shopping tips, sale announcements, price drop analyses, and festive deal coverage.
        </p>
      </div>

      <ArticleForm />
    </div>
  );
}
