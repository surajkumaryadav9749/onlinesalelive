import React from 'react';
import Link from 'next/link';
import { connectToDatabase } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Deal } from '@/models/Deal';
import { Guide } from '@/models/Guide';
import { Review } from '@/models/Review';
import { Article } from '@/models/Article';
import { Comparison } from '@/models/Comparison';
import { AffiliateClick } from '@/models/AffiliateClick';
import { AdminHeader } from '@/components/admin/AdminHeader';
import {
  Package,
  Layers,
  Flame,
  BookOpen,
  Award,
  Newspaper,
  GitCompare,
  ArrowRight,
  TrendingUp,
  Database,
  MousePointerClick,
  ExternalLink,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const conn = await connectToDatabase();
  const isDbConnected = Boolean(conn && conn.connection.readyState === 1);

  let counts = {
    products: 0,
    categories: 0,
    deals: 0,
    guides: 0,
    reviews: 0,
    articles: 0,
    comparisons: 0,
    affiliateClicks: 0,
  };

  let recentProducts: Array<{
    _id: string;
    name: string;
    slug: string;
    price: number;
    categorySlug?: string;
    createdAt: string;
  }> = [];

  let recentClicks: Array<{
    _id: string;
    marketplace: string;
    productName?: string;
    productSlug?: string;
    isAffiliate: boolean;
    createdAt: string;
  }> = [];

  if (isDbConnected) {
    try {
      const [
        productCount,
        categoryCount,
        dealCount,
        guideCount,
        reviewCount,
        articleCount,
        comparisonCount,
        affiliateClickCount,
        recent,
        clicks,
      ] = await Promise.all([
        Product.countDocuments(),
        Category.countDocuments(),
        Deal.countDocuments({ isActive: true }),
        Guide.countDocuments({ isPublished: true }),
        Review.countDocuments({ isPublished: true }),
        Article.countDocuments({ isPublished: true }),
        Comparison.countDocuments(),
        AffiliateClick.countDocuments(),
        Product.find().sort({ createdAt: -1 }).limit(5).lean(),
        AffiliateClick.find().sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      counts = {
        products: productCount,
        categories: categoryCount,
        deals: dealCount,
        guides: guideCount,
        reviews: reviewCount,
        articles: articleCount,
        comparisons: comparisonCount,
        affiliateClicks: affiliateClickCount,
      };

      recentProducts = recent.map((p) => ({
        _id: String(p._id),
        name: p.name,
        slug: p.slug,
        price: p.price,
        categorySlug: p.categorySlug,
        createdAt: new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN'),
      }));

      recentClicks = clicks.map((c) => ({
        _id: String(c._id),
        marketplace: c.marketplace,
        productName: c.productName || c.productSlug || 'Marketplace Item',
        productSlug: c.productSlug,
        isAffiliate: c.isAffiliate,
        createdAt: new Date(c.createdAt || Date.now()).toLocaleDateString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
    } catch (e) {
      console.error('Error fetching admin counts:', e instanceof Error ? e.message : e);
    }
  }

  const statCards = [
    {
      label: 'Total Products',
      count: counts.products,
      icon: Package,
      href: '/admin/products',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      label: 'Categories',
      count: counts.categories,
      icon: Layers,
      href: '/admin/categories',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      label: 'Active Deals',
      count: counts.deals,
      icon: Flame,
      href: '/admin/deals',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      label: 'Affiliate Clicks',
      count: counts.affiliateClicks,
      icon: MousePointerClick,
      href: '#affiliate-clicks',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      label: 'Published Guides',
      count: counts.guides,
      icon: BookOpen,
      href: '/admin/guides',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: 'Product Reviews',
      count: counts.reviews,
      icon: Award,
      href: '/admin/reviews',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Blog Articles',
      count: counts.articles,
      icon: Newspaper,
      href: '/admin/blog',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      label: 'Comparisons',
      count: counts.comparisons,
      icon: GitCompare,
      href: '/admin/comparisons',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  const quickActions = [
    { label: 'Add Product', href: '/admin/products/new', icon: Package },
    { label: 'Add Category', href: '/admin/categories/new', icon: Layers },
    { label: 'Add Deal', href: '/admin/deals/new', icon: Flame },
    { label: 'Add Guide', href: '/admin/guides/new', icon: BookOpen },
    { label: 'Add Review', href: '/admin/reviews/new', icon: Award },
    { label: 'Add Article', href: '/admin/blog/new', icon: Newspaper },
    { label: 'Add Comparison', href: '/admin/comparisons/new', icon: GitCompare },
  ];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Dashboard Overview"
        subtitle="Manage catalog, festive deals, buying guides, and editorial content"
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Database Status Alert */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs font-medium ${
            isDbConnected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Database size={16} className={isDbConnected ? 'text-emerald-600' : 'text-amber-600'} />
            <span>
              {isDbConnected
                ? 'MongoDB Database is connected and active. CMS reads and writes directly to MongoDB.'
                : 'MongoDB connection string not detected or unreachable. Check your .env.local file.'}
            </span>
          </div>
          {isDbConnected && counts.products === 0 && (
            <span className="font-bold text-orange-700">
              Run &ldquo;npm run seed&rdquo; in terminal to import mock catalog.
            </span>
          )}
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.href}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color}`}>
                    <Icon size={18} />
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {card.count}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">
                    {card.label}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-600" />
            <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white group-hover:bg-orange-600 text-slate-600 group-hover:text-white flex items-center justify-center mb-1.5 transition-colors shadow-2xs">
                    <Icon size={15} />
                  </div>
                  <span className="text-[11px] font-bold leading-tight">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Products Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recently Added Products</h2>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              <span>View All Products</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {recentProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Added On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium capitalize">
                          {p.categorySlug || 'general'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{p.price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{p.createdAt}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="text-orange-600 hover:underline font-semibold"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No products found in the database. Click &ldquo;Add Product&rdquo; or run seed to populate.
            </div>
          )}
        </div>

        {/* Affiliate Clicks Activity */}
        <div id="affiliate-clicks" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <MousePointerClick size={18} className="text-rose-600" />
                <h2 className="text-base font-bold text-slate-900">Affiliate Clicks Activity</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Outbound referral clicks recorded through the /go redirect engine.
              </p>
            </div>
            <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
              Note: Clicks represent outbound referral visits, not completed sales or commissions.
            </span>
          </div>

          {recentClicks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Marketplace</th>
                    <th className="py-3 px-4">Product / Item</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Target Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentClicks.map((click) => (
                    <tr key={click._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{click.marketplace}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{click.productName}</td>
                      <td className="py-3 px-4">
                        {click.isAffiliate ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            Affiliate Deep Link
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">
                            Standard Retail
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{click.createdAt}</td>
                      <td className="py-3 px-4 text-right">
                        {click.productSlug && (
                          <Link
                            href={`/go/${click.marketplace.toLowerCase()}/${click.productSlug}`}
                            target="_blank"
                            className="text-rose-600 hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            <span>/go/{click.marketplace.toLowerCase()}/{click.productSlug}</span>
                            <ExternalLink size={11} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No affiliate click events logged yet. Outbound clicks via /go routes will appear here in real time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
