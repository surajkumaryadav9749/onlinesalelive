import React from 'react';
import { ComparisonForm } from '@/components/admin/ComparisonForm';

export const metadata = {
  title: 'Create Comparison | Admin CMS',
};

export default function NewComparisonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Comparison</h1>
        <p className="text-slate-500 text-sm mt-1">
          Assemble side-by-side product matchups, key differences, and recommendation matrices.
        </p>
      </div>

      <ComparisonForm />
    </div>
  );
}
