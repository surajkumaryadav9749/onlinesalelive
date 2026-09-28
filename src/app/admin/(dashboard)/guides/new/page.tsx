import React from 'react';
import { GuideForm } from '@/components/admin/GuideForm';

export const metadata = {
  title: 'Write Buying Guide | Admin CMS',
};

export default function NewGuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Write New Buying Guide</h1>
        <p className="text-slate-500 text-sm mt-1">
          Create comprehensive purchasing advice, top picks, and curated criteria for shoppers.
        </p>
      </div>

      <GuideForm />
    </div>
  );
}
