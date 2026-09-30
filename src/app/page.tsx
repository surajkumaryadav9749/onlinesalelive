import React from 'react';
import Link from 'next/link';
import {
  getAllCategories,
  getAllProducts,
  getTodaysDeals,
  getPopularDeals,
  getMostClickedProducts,
  getFeaturedProducts,
  getTrendingProductsWithMeta,
  getProductsUnderPrice,
  getAllGuides,
  getAllReviews,
  getAllComparisons,
  getMajorDiscounts,
  getActiveHeroBanners,
  getHomepageDiscoveryData,
} from '@/lib/data-service';
import { HeroBackgroundCarousel } from '@/components/home/HeroBackgroundCarousel';
import { HomeDiscountDiscovery } from '@/components/home/HomeDiscountDiscovery';
import { HomeDealsBudgetCategories } from '@/components/home/HomeDealsBudgetCategories';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProductCard } from '@/components/products/ProductCard';
import { DealCard } from '@/components/deals/DealCard';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { GuideCard } from '@/components/guides/GuideCard';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ComparisonCard } from '@/components/compare/ComparisonCard';
import {
  Zap,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'OnlineSaleLive | Best Deals, Sales & Discounts in India',
  description:
    'Discover verified deals, mega festive sales, product comparisons, and lowest prices across Amazon, Flipkart, Myntra, AJIO, and Meesho.',
  alternates: {
    canonical: buildCanonicalUrl('/'),
  },
};

export const revalidate = 60;

export default async function HomePage() {
  const [
    heroBanners,
    categories,
    todaysDeals,
    popularDealsResult,
    mostClickedResult,
    trendingResult,
    featuredProducts,
    comparisons,
    under500Products,
    under1000Products,
    guides,
    reviews,
    majorDiscounts,
    allProducts,
    discoveryData,
  ] = await Promise.all([
    getActiveHeroBanners(5),
    getAllCategories(),
    getTodaysDeals(4),
    getPopularDeals({ limit: 4 }),
    getMostClickedProducts({ limit: 4, days: 7 }),
    getTrendingProductsWithMeta(4, 7),
    getFeaturedProducts(4),
    getAllComparisons(),
    getProductsUnderPrice(500),
    getProductsUnderPrice(1000),
    getAllGuides(),
    getAllReviews(),
    getMajorDiscounts(50),
    getAllProducts(),
    getHomepageDiscoveryData(),
  ]);

  const hasAnyCatalogContent =
    todaysDeals.length > 0 ||
    popularDealsResult.deals.length > 0 ||
    featuredProducts.length > 0 ||
    trendingResult.products.length > 0 ||
    categories.length > 0 ||
    under500Products.length > 0 ||
    under1000Products.length > 0 ||
    majorDiscounts.length > 0 ||
    guides.length > 0 ||
    reviews.length > 0 ||
    comparisons.length > 0 ||
    discoveryData.discountCategories.length > 0 ||
    discoveryData.budgetTiers.length > 0 ||
    discoveryData.categories.length > 0;

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200/80 min-h-[380px] sm:min-h-[540px] lg:min-h-[580px] xl:min-h-[600px] flex items-center py-6 sm:py-14 lg:py-16 bg-orange-50/40">
        {/* Dynamic Background Banner Carousel */}
        <HeroBackgroundCarousel banners={heroBanners} />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-left w-full lg:w-[48%] xl:w-[45%] max-w-xl lg:max-w-none mr-auto">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-orange-100/70 border border-orange-200/90 text-slate-800 text-[11px] sm:text-sm font-semibold px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full mb-3 sm:mb-5 shadow-2xs max-w-full">
              <Tag size={13} className="text-orange-600 shrink-0 sm:w-[15px] sm:h-[15px]" />
              <span>Compare Live Offers Across Top Indian Marketplaces</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] xl:text-[58px] font-black text-slate-950 tracking-tight leading-[1.12] sm:leading-[1.1] max-w-[280px] sm:max-w-none">
              Find the Best <span className="text-orange-600">Deals</span>,{' '}
              <span className="text-red-600">Sales</span> & Discounts
            </h1>

            {/* Supporting Text */}
            <p className="mt-2.5 sm:mt-5 text-xs sm:text-base text-slate-700 leading-relaxed font-normal max-w-[245px] sm:max-w-lg">
              OnlineSaleLive helps you discover verified price drops, major discounts, expert buying guides, and multi-store price comparisons across <strong>Amazon, Flipkart, Myntra, AJIO</strong> and <strong>Meesho</strong>.
            </p>

            {/* CTAs */}
            <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-2.5 sm:gap-4 max-w-[220px] sm:max-w-none">
              <Link
                href="/deals"
                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs sm:text-base px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl shadow-lg shadow-orange-600/25 transition-all transform hover:-translate-y-0.5"
              >
                <Zap size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Explore Deals</span>
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-slate-800 border border-slate-300 font-bold text-xs sm:text-base px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl shadow-xs transition-all hover:border-slate-400"
              >
                <span>Browse Categories</span>
                <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-4 sm:mt-8 pt-3 sm:pt-6 border-t border-slate-300/40 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-start gap-1.5 sm:gap-6 text-[11px] sm:text-xs font-semibold text-slate-600 max-w-[250px] sm:max-w-none">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0 sm:w-4 sm:h-4" />
                <span>100% Free & No Account Needed</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <TrendingDown size={14} className="text-orange-600 shrink-0 sm:w-4 sm:h-4" />
                <span>Price Drop Alerts & Comparison</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ShoppingBag size={14} className="text-blue-600 shrink-0 sm:w-4 sm:h-4" />
                <span>5+ Indian Marketplaces Tracked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background blob (only shown when no custom hero banners exist) */}
        {heroBanners.length === 0 && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40">
            <div className="absolute top-10 left-10 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl" />
            <div className="absolute top-20 right-10 w-80 h-80 bg-red-300/20 rounded-full blur-3xl" />
          </div>
        )}
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">
        {/* NEW SECTION: Shop by Deals, Budget & Categories */}
        <HomeDealsBudgetCategories data={discoveryData} />

        {/* Live Deals Catalog Updating State (when DB collections are empty) */}
        {!hasAnyCatalogContent && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-xs">
            <div className="inline-flex p-4 bg-orange-100 rounded-2xl text-orange-600 mb-4">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Live Deals Catalog Updating</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Our team is syncing verified discounts and real-time price drops across Amazon, Flipkart, Myntra, AJIO, and Meesho. Check back shortly as fresh offers go live.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 px-4 py-2 rounded-lg"
              >
                Learn About Our Verification
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-lg"
              >
                Contact Deal Team
              </Link>
            </div>
          </div>
        )}

        {/* 2. TODAY'S DEALS SECTION */}
        {todaysDeals.length > 0 && (
          <section>
            <SectionHeader
              title="Today's Handpicked Deals"
              subtitle="Limited-time price cuts and flash offers updated in real-time"
              badge="Live Offers"
              viewAllLink="/todays-deals"
              viewAllText="View All Today's Deals"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {todaysDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}

        {/* 2B. POPULAR DEALS SECTION */}
        {popularDealsResult.deals.length > 0 && (
          <section>
            <SectionHeader
              title={popularDealsResult.isClickPopular ? 'Popular Verified Deals' : 'Featured Value Deals'}
              subtitle={
                popularDealsResult.isClickPopular
                  ? `Deals attracting the highest shopper activity over the past ${popularDealsResult.timeWindowDays} days`
                  : 'Hand-picked price cuts with verified availability across partner stores'
              }
              badge={popularDealsResult.isClickPopular ? 'High Activity' : "Editor's Choice"}
              viewAllLink="/deals"
              viewAllText="Explore All Deals"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {popularDealsResult.deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}

        {/* 2C. MOST CLICKED PRODUCTS (Only when real click data exists) */}
        {mostClickedResult.hasRealClickData && mostClickedResult.products.length > 0 && (
          <section className="bg-slate-50/80 p-6 sm:p-8 rounded-3xl border border-slate-200">
            <SectionHeader
              title="Most Clicked by Shoppers"
              subtitle={`Products Indian shoppers explored most frequently across Amazon, Flipkart & partner stores in the last ${mostClickedResult.timeWindowDays} days`}
              badge="Top Click Activity"
              viewAllLink="/products"
              viewAllText="View All Products"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {mostClickedResult.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 3. MAJOR DISCOUNTS SECTION (50%+ OFF) */}
        {majorDiscounts.length > 0 && (
          <section>
            <SectionHeader
              title="Major Discounts (50% to 75% OFF)"
              subtitle="Deepest clearance bargains and seasonal price slashes"
              badge="Steal Deals"
              viewAllLink="/discounts"
              viewAllText="Explore All Discounts"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {majorDiscounts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 3B. PRODUCT DISCOUNT DISCOVERY FILTER */}
        {allProducts.length > 0 && (
          <HomeDiscountDiscovery products={allProducts} />
        )}

        {/* 4. POPULAR CATEGORIES */}
        {categories.length > 0 && (
          <section>
            <SectionHeader
              title="Popular Categories"
              subtitle="Find deals organized by what you're shopping for today"
              viewAllLink="/categories"
              viewAllText="View All Categories"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {categories.slice(0, 8).map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </section>
        )}

        {/* 5. PRODUCTS UNDER ₹500 */}
        {under500Products.length > 0 && (
          <section className="bg-amber-50/60 p-6 sm:p-8 rounded-3xl border border-amber-200/80">
            <SectionHeader
              title="Best Products Under ₹500"
              subtitle="High-utility essentials, earphones, t-shirts and cables on a tight budget"
              badge="Pocket Friendly"
              viewAllLink="/products-under-500"
              viewAllText="Explore Under ₹500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {under500Products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 6. PRODUCTS UNDER ₹1000 */}
        {under1000Products.length > 0 && (
          <section className="bg-blue-50/60 p-6 sm:p-8 rounded-3xl border border-blue-200/80">
            <SectionHeader
              title="Top Deals Under ₹1000"
              subtitle="ANC earbuds, stretch jeans, sports shoes, and electric kettles"
              badge="Sweet Spot"
              viewAllLink="/products-under-1000"
              viewAllText="Explore Under ₹1000"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {under1000Products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 7. TRENDING PRODUCTS / FEATURED FALLBACK */}
        {trendingResult.products.length > 0 && (
          <section>
            <SectionHeader
              title={
                trendingResult.isCalculatedTrend
                  ? 'Trending Products in India'
                  : 'Featured Products'
              }
              subtitle={
                trendingResult.isCalculatedTrend
                  ? `Ranked by recent shopper engagement velocity and recency over the last ${trendingResult.timeWindowDays} days`
                  : 'Curated selection of popular and flagship products across top categories'
              }
              badge={trendingResult.label}
              viewAllLink="/products"
              viewAllText="Browse All Products"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {trendingResult.products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 7B. CURATED COMPARISONS */}
        {comparisons.length > 0 && (
          <section>
            <SectionHeader
              title="Expert Head-to-Head Comparisons"
              subtitle="Side-by-side spec breakdowns, benchmark scores, and laboratory verdict notes"
              badge="Side by Side"
              viewAllLink="/compare"
              viewAllText="View All Comparisons"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comparisons.slice(0, 2).map((comp) => (
                <ComparisonCard key={comp.id} comparison={comp} />
              ))}
            </div>
          </section>
        )}

        {/* 8. BUYING GUIDES */}
        {guides.length > 0 && (
          <section>
            <SectionHeader
              title="Expert Buying Guides & Recommendations"
              subtitle="In-depth laboratory tests and specs comparisons to guide your purchases"
              badge="Buyer Advice"
              viewAllLink="/guides"
              viewAllText="Read All Guides"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.slice(0, 3).map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        )}

        {/* 9. LATEST PRODUCT REVIEWS */}
        {reviews.length > 0 && (
          <section>
            <SectionHeader
              title="Latest Hands-On Product Reviews"
              subtitle="Unbiased assessments with detailed pros, cons, and store comparisons"
              badge="Verified Tests"
              viewAllLink="/reviews"
              viewAllText="See All Reviews"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((rev) => (
                <ReviewCard key={rev.id} review={rev} />
              ))}
            </div>
          </section>
        )}

        {/* 10. FEATURED & FLAGSHIP DEALS */}
        {featuredProducts.length > 0 && (
          <section>
            <SectionHeader
              title="Featured Editor's Picks"
              subtitle="Top tier performance laptops, 5G smartphones and audiophile headphones"
              badge="Staff Pick"
              viewAllLink="/sale"
              viewAllText="Explore Festive Sale"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 11. QUICK COMPARISON BANNER */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">
              Smart Decision Tool
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Confused Between Two Products?
            </h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Use our side-by-side comparison tool to evaluate specifications, benchmark ratings, battery longevity, and marketplace prices in one clean matrix.
            </p>
          </div>
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shrink-0 shadow-lg shadow-orange-600/30"
          >
            <span>Launch Compare Tool</span>
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
