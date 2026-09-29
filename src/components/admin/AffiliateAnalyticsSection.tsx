'use client';

import React, { useState, useEffect } from 'react';
import {
  MousePointerClick,
  ShoppingCart,
  PackageCheck,
  Percent,
  TrendingUp,
  Coins,
  Calendar,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  X,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import {
  AffiliateAnalyticsResponse,
  ProductPerformanceItem,
  AnalyticsPeriod,
} from '@/lib/affiliate-analytics';

export function AffiliateAnalyticsSection() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [marketplace, setMarketplace] = useState<string>('Amazon');
  const [trackingId, setTrackingId] = useState<string>('all');
  const [availableTrackingIds, setAvailableTrackingIds] = useState<string[]>([]);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomRange, setShowCustomRange] = useState<boolean>(false);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [analytics, setAnalytics] = useState<AffiliateAnalyticsResponse | null>(null);

  const [productSortBy, setProductSortBy] = useState<'clicks' | 'sales' | 'earnings' | 'orders'>('clicks');
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductPerformanceItem[]>([]);
  const [hasProductReportData, setHasProductReportData] = useState<boolean>(false);

  const [chartMetric, setChartMetric] = useState<'clicks' | 'orders' | 'earnings'>('clicks');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Report Import Modal state
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTrackingId, setImportTrackingId] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');

  // 1. Fetch available tracking IDs once
  useEffect(() => {
    let ignore = false;
    async function loadTrackingIds() {
      try {
        const res = await fetch(`/api/admin/affiliate/tracking-ids?marketplace=${marketplace}`);
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data.trackingIds)) {
          setAvailableTrackingIds(data.data.trackingIds);
        }
      } catch (err) {
        console.warn('Error loading tracking IDs:', err);
      }
    }
    void loadTrackingIds();
    return () => {
      ignore = true;
    };
  }, [marketplace]);

  // 2. Fetch KPI and product performance in a synchronized effect
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const params = new URLSearchParams();
        params.set('marketplace', marketplace);
        params.set('period', period);
        if (trackingId !== 'all') params.set('trackingId', trackingId);
        if (period === 'custom' && customStart && customEnd) {
          params.set('startDate', customStart);
          params.set('endDate', customEnd);
        }

        const [analyticsRes, productsRes] = await Promise.all([
          fetch(`/api/admin/affiliate/analytics?${params.toString()}`),
          fetch(`/api/admin/affiliate/products?${params.toString()}&sortBy=${productSortBy}&limit=20`),
        ]);

        const analyticsData = await analyticsRes.json();
        const productsData = await productsRes.json();

        if (!ignore) {
          if (analyticsData.success) {
            setAnalytics(analyticsData.data);
            setError('');
          } else {
            setError(analyticsData.error || 'Failed to load affiliate analytics');
          }

          if (productsData.success && productsData.data) {
            setProducts(productsData.data.products || []);
            setHasProductReportData(Boolean(productsData.data.hasProductReportData));
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Network error loading analytics');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setProductsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [marketplace, period, trackingId, customStart, customEnd, productSortBy, refreshIndex]);

  // 3. Handle Report Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('Please select an Amazon Associates CSV report file');
      return;
    }

    setImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('marketplace', marketplace);
      if (importTrackingId.trim()) {
        formData.append('trackingId', importTrackingId.trim());
      }

      const res = await fetch('/api/admin/affiliate/reports/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import report');
      }

      setImportSuccess(
        `Successfully imported ${data.data.importedCount} records (${data.data.totalOrders} orders, ₹${data.data.totalEarnings.toLocaleString('en-IN')} earnings).`
      );
      setImportFile(null);

      // Refresh analytics data
      setLoading(true);
      setProductsLoading(true);
      setRefreshIndex((prev) => prev + 1);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Error importing report');
    } finally {
      setImporting(false);
    }
  };

  const kpis = analytics?.kpis || {
    clicks: 0,
    amazonReportedClicks: 0,
    orders: 0,
    itemsShipped: 0,
    conversionRate: 0,
    sales: 0,
    earnings: 0,
  };

  // Helper for Chart SVG
  const timeSeries = analytics?.timeSeries || [];
  const chartValues = timeSeries.map((t) => t[chartMetric]);
  const maxChartValue = Math.max(...chartValues, 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-6">
      {/* 1. Header with Filters & Actions */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Amazon Affiliate Analytics
            </h2>
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <ShieldCheck size={11} />
              <span>Admin Only</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real website outbound click tracking and verified Amazon Associates revenue metrics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Marketplace Selector */}
          <div className="relative">
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="text-xs bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-colors"
            >
              <option value="Amazon">Amazon</option>
              <option value="all">All Marketplaces</option>
              <option value="Flipkart">Flipkart</option>
              <option value="Myntra">Myntra</option>
              <option value="AJIO">AJIO</option>
              <option value="Meesho">Meesho</option>
            </select>
          </div>

          {/* Tracking ID Selector */}
          {availableTrackingIds.length > 0 && (
            <div className="relative">
              <select
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="text-xs bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-colors"
              >
                <option value="all">All Tracking IDs</option>
                {availableTrackingIds.map((tid) => (
                  <option key={tid} value={tid}>
                    {tid}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setPeriod('today');
                setShowCustomRange(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'today' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('yesterday');
                setShowCustomRange(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'yesterday' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('7d');
                setShowCustomRange(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === '7d' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('30d');
                setShowCustomRange(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === '30d' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('month');
                setShowCustomRange(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'month' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('custom');
                setShowCustomRange(!showCustomRange);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'custom' ? 'bg-white text-orange-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Import Report Button */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
            title="Import official Amazon Associates earnings/order report CSV"
          >
            <UploadCloud size={14} className="text-orange-600" />
            <span>Import Report</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => setRefreshIndex((prev) => prev + 1)}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Dropdown */}
      {showCustomRange && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Select Custom Range:</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (customStart && customEnd) {
                setRefreshIndex((prev) => prev + 1);
              }
            }}
            className="px-3 py-1.5 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mx-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRefreshIndex((prev) => prev + 1)}
            className="ml-auto underline font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Six KPI Cards */}
      <div className="px-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Card 1: Clicks */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-blue-50 text-blue-700 border-blue-200">
                <MousePointerClick size={18} />
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Website
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? '...' : kpis.clicks.toLocaleString('en-IN')}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Clicks</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Outbound referral visits
              </div>
            </div>
          </div>

          {/* Card 2: Orders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-amber-50 text-amber-700 border-amber-200">
                <ShoppingCart size={18} />
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                Amazon
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? '...' : kpis.orders.toLocaleString('en-IN')}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Orders</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Verified ordered items
              </div>
            </div>
          </div>

          {/* Card 3: Items Shipped */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-indigo-50 text-indigo-700 border-indigo-200">
                <PackageCheck size={18} />
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Fulfilled
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? '...' : kpis.itemsShipped.toLocaleString('en-IN')}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Items Shipped</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Dispatched to shoppers
              </div>
            </div>
          </div>

          {/* Card 4: Conversion Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-purple-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-purple-50 text-purple-700 border-purple-200">
                <Percent size={18} />
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Ratio
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? '...' : `${kpis.conversionRate.toFixed(2)}%`}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Conversion Rate</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Orders ÷ Clicks × 100
              </div>
            </div>
          </div>

          {/* Card 5: Sales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-orange-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-orange-50 text-orange-700 border-orange-200">
                <TrendingUp size={18} />
              </div>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                Gross
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? '...' : `₹${kpis.sales.toLocaleString('en-IN')}`}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Sales</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Reported product revenue
              </div>
            </div>
          </div>

          {/* Card 6: Earnings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-emerald-50 text-emerald-700 border-emerald-200">
                <Coins size={18} />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Net Fee
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? '...' : `₹${kpis.earnings.toLocaleString('en-IN')}`}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Earnings</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Verified affiliate commission
              </div>
            </div>
          </div>
        </div>

        {/* Data Source & Provenance Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-slate-400 shrink-0" />
            <span>
              <strong>Data Source:</strong> {analytics?.meta.dataSource || 'Website Click Tracker'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            {analytics?.meta.lastReportDate && (
              <span>Last report date: <strong>{analytics.meta.lastReportDate}</strong></span>
            )}
            <span>Range: <strong>{analytics?.meta.startDate}</strong> to <strong>{analytics?.meta.endDate}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Lightweight Time-Series Trend Charts */}
      {timeSeries.length > 0 && (
        <div className="mx-6 p-5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-slate-600" />
              <h3 className="font-bold text-sm text-slate-900">Performance Over Time</h3>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setChartMetric('clicks')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  chartMetric === 'clicks'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Clicks
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  chartMetric === 'orders'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Orders
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('earnings')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  chartMetric === 'earnings'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Earnings (₹)
              </button>
            </div>
          </div>

          {/* SVG Bar Chart with Hover Tooltip */}
          <div className="relative pt-4">
            <div className="h-40 flex items-end gap-1 sm:gap-2 px-2 border-b border-slate-200">
              {timeSeries.map((point, idx) => {
                const val = point[chartMetric];
                const heightPercent = maxChartValue > 0 ? Math.max((val / maxChartValue) * 100, 4) : 4;
                const isHovered = hoveredPoint === idx;

                let barColor = 'bg-blue-500 hover:bg-blue-600';
                if (chartMetric === 'orders') barColor = 'bg-amber-500 hover:bg-amber-600';
                if (chartMetric === 'earnings') barColor = 'bg-emerald-500 hover:bg-emerald-600';

                return (
                  <div
                    key={point.date}
                    className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-10 z-20 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
                        <div>{point.label}</div>
                        <div className="text-orange-400">
                          {chartMetric === 'earnings' ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t transition-all ${
                        val > 0 ? barColor : 'bg-slate-200'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis date labels */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-2">
              <span>{timeSeries[0]?.label}</span>
              {timeSeries.length > 2 && (
                <span>{timeSeries[Math.floor(timeSeries.length / 2)]?.label}</span>
              )}
              <span>{timeSeries[timeSeries.length - 1]?.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Product Performance & Top Products */}
      <div className="p-6 pt-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900">Amazon Product Performance</h3>
              {hasProductReportData ? (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Report Synced
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  Report Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of outbound referral clicks and reported purchases by product.
            </p>
          </div>

          {/* Sort tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Sort:</span>
            <button
              type="button"
              onClick={() => setProductSortBy('clicks')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                productSortBy === 'clicks'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Most Clicks
            </button>
            <button
              type="button"
              onClick={() => setProductSortBy('sales')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                productSortBy === 'sales'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Highest Sales
            </button>
            <button
              type="button"
              onClick={() => setProductSortBy('earnings')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                productSortBy === 'earnings'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Highest Earnings
            </button>
            <button
              type="button"
              onClick={() => setProductSortBy('orders')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                productSortBy === 'orders'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Most Orders
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Clicks</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Items Shipped</th>
                <th className="py-3 px-4">Sales</th>
                <th className="py-3 px-4">Earnings</th>
                <th className="py-3 px-4 text-right">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productsLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading product performance...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-600">
                      No product-level Amazon report data available yet.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Referral clicks and imported Amazon item reports will appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.productSlug} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 leading-snug line-clamp-1">
                        {p.productName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400">{p.productSlug}</span>
                        {p.asin && (
                          <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            ASIN: {p.asin}
                          </span>
                        )}
                        {!p.hasReportData && (
                          <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                            Website Clicks Only
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-700">
                      {p.clicks.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.orders.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.itemsShipped.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ₹{p.sales.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₹{p.earnings.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.conversionRate > 0
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {p.conversionRate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Report Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud size={20} className="text-orange-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Import Amazon Associates Report
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportError('');
                  setImportSuccess('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Upload an official <strong>Earnings Report</strong> or <strong>Orders Report</strong> CSV exported from your{' '}
                <a
                  href="https://affiliate-program.amazon.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 underline font-semibold inline-flex items-center gap-1"
                >
                  Amazon Associates Portal <ExternalLink size={11} />
                </a>.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                Supported columns: <em>Date, Tracking ID, Clicks, Ordered Items, Shipped Items, Shipped Items Revenue, Total Earnings</em>.
              </div>
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Report File (.csv)
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tracking ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. onlinesalelive-21 (leave blank to read from CSV)"
                  value={importTrackingId}
                  onChange={(e) => setImportTrackingId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!importFile || importing}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {importing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Validating & Importing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Upload & Process Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
