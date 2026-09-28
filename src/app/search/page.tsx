import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  searchProducts,
  searchEntities,
  getAllCategories,
  getAllGuides,
} from '@/lib/data-service';
import { ProductCard } from '@/components/products/ProductCard';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { GuideCard } from '@/components/guides/GuideCard';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { BlogCard } from '@/components/blog/BlogCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SearchFilterBar } from '@/components/search/SearchFilterBar';
import { SearchPagination } from '@/components/search/SearchPagination';
import {
  Search as SearchIcon,
  Package,
  Sparkles,
  Layers,
  BookOpen,
  Award,
  Newspaper,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    marketplace?: string;
    minPrice?: string;
    maxPrice?: string;
    minDiscount?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || '';
  const title = query
    ? `Search results for "${query}" | OnlineSaleLive`
    : 'Search Deals & Products | OnlineSaleLive';

  return {
    title,
    description: query
      ? `Discover deals, guides, and reviews matching "${query}" across Amazon, Flipkart, Myntra, AJIO, and Meesho.`
      : 'Search across thousands of verified deals, best prices, and buyer guides on OnlineSaleLive.',
    // Robots: noindex, follow to prevent indexing arbitrary parameter combinations
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const rawQ = resolvedParams.q || '';
  const query = rawQ.trim();
  const category = (resolvedParams.category || '').trim();
  const marketplace = (resolvedParams.marketplace || '').trim();

  const minPrice = resolvedParams.minPrice ? Number(resolvedParams.minPrice) : undefined;
  const maxPrice = resolvedParams.maxPrice ? Number(resolvedParams.maxPrice) : undefined;
  const minDiscount = resolvedParams.minDiscount ? Number(resolvedParams.minDiscount) : undefined;
  const sort = resolvedParams.sort || 'relevance';
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10) || 1);

  // Execute database search and fetch reference categories
  const [productsResult, entitiesResult, allCategories, fallbackGuides] = await Promise.all([
    searchProducts({
      q: query,
      category: category || undefined,
      marketplace: marketplace || undefined,
      minPrice: !isNaN(Number(minPrice)) ? minPrice : undefined,
      maxPrice: !isNaN(Number(maxPrice)) ? maxPrice : undefined,
      minDiscount: !isNaN(Number(minDiscount)) ? minDiscount : undefined,
      sort,
      page,
      limit: 20,
    }),
    query ? searchEntities(query) : Promise.resolve({ categories: [], guides: [], reviews: [], blogPosts: [] }),
    getAllCategories(),
    getAllGuides(),
  ]);

  const { products, total, totalPages, hasNext, hasPrev } = productsResult;
  const { categories: matchedCategories, guides: matchedGuides, reviews: matchedReviews, blogPosts: matchedBlogPosts } = entitiesResult;

  const totalContentMatches =
    matchedCategories.length +
    matchedGuides.length +
    matchedReviews.length +
    matchedBlogPosts.length;

  const hasAnyQueryOrFilter = Boolean(
    query ||
    category ||
    marketplace ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    minDiscount !== undefined ||
    (sort && sort !== 'relevance')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Search Results' }]} />

      {/* Search Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <SearchIcon size={14} />
            <span>Search Discovery Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {query ? (
              <>
                Search Results for &ldquo;{query}&rdquo;
              </>
            ) : hasAnyQueryOrFilter ? (
              'Filtered Products & Deals'
            ) : (
              'Search Deals, Products & Buying Advice'
            )}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {query ? (
              <>
                Found <span className="text-orange-400 font-bold">{total}</span> matching products
                {totalContentMatches > 0 && (
                  <> and <span className="text-orange-400 font-bold">{totalContentMatches}</span> relevant guides, reviews & categories</>
                )}.
              </>
            ) : (
              'Search products or filter by store, category, discount percentage, and price bracket.'
            )}
          </p>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <SearchFilterBar
        categories={allCategories.map((c) => ({ slug: c.slug, name: c.name }))}
        totalResults={total}
      />

      {/* Empty State */}
      {hasAnyQueryOrFilter && total === 0 && totalContentMatches === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 max-w-2xl mx-auto shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <Package size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            No products found matching your search.
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Try adjusting your keyword, resetting filters, or explore our top-rated categories and buyer guides below.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <RotateCcw size={14} />
              <span>Clear Search & Filters</span>
            </Link>
            <Link
              href="/products"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
            >
              Browse All Products
            </Link>
            <Link
              href="/todays-deals"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
            >
              Today&apos;s Deals
            </Link>
          </div>

          {/* Quick Categories in Empty State */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Popular Categories
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {allCategories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 rounded-full text-xs font-medium text-slate-700 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fresh Landing State (No query, no filters) */}
      {!hasAnyQueryOrFilter && (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-5 max-w-3xl mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            What are you shopping for today?
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Search by brand, category, or product name, or click one of our popular quick searches below.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['Earbuds', 'Smartwatch', 'Sneakers', 'Laptops', '5G Phones', 'Under 500', 'Under 1000'].map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag.toLowerCase())}`}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Product Results */}
      {products.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-orange-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Products ({total})
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Server-side Pagination */}
          <SearchPagination
            page={page}
            totalPages={totalPages}
            hasNext={hasNext}
            hasPrev={hasPrev}
            queryParams={resolvedParams}
          />
        </section>
      )}

      {/* Matched Categories */}
      {matchedCategories.length > 0 && (
        <section className="space-y-4 pt-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Layers size={20} className="text-orange-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Matching Categories ({matchedCategories.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {matchedCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>
      )}

      {/* Matched Buying Guides */}
      {matchedGuides.length > 0 && (
        <section className="space-y-4 pt-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-orange-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Buying Guides ({matchedGuides.length})
              </h2>
            </div>
            <Link
              href="/guides"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>All Guides</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedGuides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </section>
      )}

      {/* Matched Reviews */}
      {matchedReviews.length > 0 && (
        <section className="space-y-4 pt-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Award size={20} className="text-orange-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Product Reviews ({matchedReviews.length})
              </h2>
            </div>
            <Link
              href="/reviews"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>All Reviews</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}

      {/* Matched Blog Posts */}
      {matchedBlogPosts.length > 0 && (
        <section className="space-y-4 pt-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Newspaper size={20} className="text-orange-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Blog Articles ({matchedBlogPosts.length})
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>All Articles</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedBlogPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Helpful Guides Recommendation if search had zero guides */}
      {query && matchedGuides.length === 0 && fallbackGuides.length > 0 && (
        <section className="pt-8 border-t border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Popular Buying Advice & Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fallbackGuides.slice(0, 3).map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
