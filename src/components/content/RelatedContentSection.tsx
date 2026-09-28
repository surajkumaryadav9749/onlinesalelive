import React from 'react';
import Link from 'next/link';
import { Guide, Review, ComparisonItem, Deal } from '@/types';
import { GuideCard } from '@/components/guides/GuideCard';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ComparisonCard } from '@/components/compare/ComparisonCard';
import { DealCard } from '@/components/deals/DealCard';
import { BookOpen, Award, GitCompare, Zap, ArrowRight } from 'lucide-react';

interface RelatedContentSectionProps {
  title?: string;
  subtitle?: string;
  guides?: Guide[];
  reviews?: Review[];
  comparisons?: ComparisonItem[];
  deals?: Deal[];
}

export const RelatedContentSection: React.FC<RelatedContentSectionProps> = ({
  title = 'Related Content & Buying Advice',
  subtitle = 'Research before you buy with editorial reviews, in-depth buying guides, and head-to-head comparisons',
  guides = [],
  reviews = [],
  comparisons = [],
  deals = [],
}) => {
  const hasAnyContent =
    guides.length > 0 ||
    reviews.length > 0 ||
    comparisons.length > 0 ||
    deals.length > 0;

  if (!hasAnyContent) {
    return null;
  }

  return (
    <section className="space-y-8 pt-6 border-t border-slate-200">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* 1. Related Active Deals */}
      {deals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider">
              <Zap size={14} />
              <span>Active Deals for You</span>
            </div>
            <Link
              href="/deals"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>All Deals</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deals.slice(0, 2).map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </div>
      )}

      {/* 2. Head-to-Head Comparisons */}
      {comparisons.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <GitCompare size={14} className="text-orange-500" />
              <span>Side-by-Side Comparisons</span>
            </div>
            <Link
              href="/compare"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Compare More</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisons.slice(0, 2).map((comp) => (
              <ComparisonCard key={comp.id} comparison={comp} />
            ))}
          </div>
        </div>
      )}

      {/* 3. Buying Guides */}
      {guides.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <BookOpen size={14} className="text-blue-600" />
              <span>Expert Buying Guides</span>
            </div>
            <Link
              href="/guides"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Explore Guides</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guides.slice(0, 2).map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </div>
      )}

      {/* 4. Editorial Reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Award size={14} className="text-amber-500" />
              <span>Editorial Reviews</span>
            </div>
            <Link
              href="/reviews"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>All Reviews</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.slice(0, 2).map((rev) => (
              <ReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
