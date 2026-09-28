import React from 'react';
import { ReviewForm } from '@/components/admin/ReviewForm';

export const metadata = {
  title: 'Write Hands-On Review | Admin CMS',
};

export default function NewReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Write Hands-On Review</h1>
        <p className="text-slate-500 text-sm mt-1">
          Publish deep-dive testing notes, score breakdown, pros/cons, and final verdicts.
        </p>
      </div>

      <ReviewForm />
    </div>
  );
}
