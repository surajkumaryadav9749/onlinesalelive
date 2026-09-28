import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  badge?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  viewAllLink,
  viewAllText = 'View All',
  badge,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2 border-b border-slate-200/80 gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {badge && (
            <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
              {badge}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
        </div>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      {viewAllLink && (
        <Link
          href={viewAllLink}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group shrink-0"
        >
          <span>{viewAllText}</span>
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      )}
    </div>
  );
};
