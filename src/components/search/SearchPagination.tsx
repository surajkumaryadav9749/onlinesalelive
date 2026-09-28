import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchPaginationProps {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  queryParams: Record<string, string | undefined>;
}

export const SearchPagination: React.FC<SearchPaginationProps> = ({
  page,
  totalPages,
  hasNext,
  hasPrev,
  queryParams,
}) => {
  if (totalPages <= 1) return null;

  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v && k !== 'page') params.set(k, v);
    });
    if (targetPage > 1) {
      params.set('page', targetPage.toString());
    }
    const queryString = params.toString();
    return `/search${queryString ? `?${queryString}` : ''}`;
  };

  // Generate page numbers window (e.g. 1, 2, 3...)
  const pages: number[] = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Search pagination" className="flex items-center justify-center gap-1.5 py-6">
      {/* Previous button */}
      {hasPrev ? (
        <Link
          href={buildPageUrl(page - 1)}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed">
          <ChevronLeft size={14} />
          <span>Previous</span>
        </span>
      )}

      {/* First page if window starts > 1 */}
      {startPage > 1 && (
        <>
          <Link
            href={buildPageUrl(1)}
            className="w-9 h-9 flex items-center justify-center text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            1
          </Link>
          {startPage > 2 && <span className="px-1 text-slate-400 text-xs">...</span>}
        </>
      )}

      {/* Window pages */}
      {pages.map((p) => {
        const isCurrent = p === page;
        return isCurrent ? (
          <span
            key={p}
            aria-current="page"
            className="w-9 h-9 flex items-center justify-center text-xs font-bold text-white bg-orange-600 rounded-xl shadow-xs"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={buildPageUrl(p)}
            className="w-9 h-9 flex items-center justify-center text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            {p}
          </Link>
        );
      })}

      {/* Last page if window ends < totalPages */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
          <Link
            href={buildPageUrl(totalPages)}
            className="w-9 h-9 flex items-center justify-center text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Next button */}
      {hasNext ? (
        <Link
          href={buildPageUrl(page + 1)}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed">
          <span>Next</span>
          <ChevronRight size={14} />
        </span>
      )}
    </nav>
  );
};
