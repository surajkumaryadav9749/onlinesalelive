import Papa from 'papaparse';
import { AffiliateClick } from '@/models/AffiliateClick';
import { AffiliateReport } from '@/models/AffiliateReport';
import { Product } from '@/models/Product';
import { MarketplaceName } from '@/types';

export type AnalyticsPeriod = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';

export interface DateRangeResult {
  period: AnalyticsPeriod;
  start: Date;
  end: Date;
  startDateStr: string;
  endDateStr: string;
  daysList: string[]; // List of 'YYYY-MM-DD' dates in range
}

export interface AffiliateKpiData {
  clicks: number; // Real website outbound clicks from AffiliateClick
  amazonReportedClicks: number; // Clicks reported by Amazon report
  orders: number; // Ordered items from verified reports
  itemsShipped: number; // Shipped items from verified reports
  conversionRate: number; // (orders / clicks) * 100, safe with 0 clicks
  sales: number; // Gross product revenue in INR
  earnings: number; // Commission earned in INR
}

export interface TimeSeriesPoint {
  date: string; // 'YYYY-MM-DD'
  label: string; // 'Sep 25'
  clicks: number;
  orders: number;
  earnings: number;
  sales: number;
}

export interface AffiliateAnalyticsResponse {
  kpis: AffiliateKpiData;
  timeSeries: TimeSeriesPoint[];
  meta: {
    marketplace: string;
    period: AnalyticsPeriod;
    startDate: string;
    endDate: string;
    trackingId: string;
    dataSource: string;
    hasReportData: boolean;
    lastReportDate: string | null;
    lastImportedAt: string | null;
  };
}

export interface ProductPerformanceItem {
  productSlug: string;
  asin?: string;
  productName: string;
  category?: string;
  clicks: number;
  orders: number;
  itemsShipped: number;
  sales: number;
  earnings: number;
  conversionRate: number;
  hasReportData: boolean;
}

/**
 * Format a Date object to YYYY-MM-DD string in local/UTC consistent format
 */
export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses user period selection into exact start/end Date range and YYYY-MM-DD list
 */
export function parseAnalyticsDateRange(
  period: string = '30d',
  customStart?: string | null,
  customEnd?: string | null
): DateRangeResult {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  let validPeriod: AnalyticsPeriod = '30d';

  // Normalize end date to end of current day (23:59:59.999)
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today':
      validPeriod = 'today';
      start.setHours(0, 0, 0, 0);
      break;

    case 'yesterday': {
      validPeriod = 'yesterday';
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      start = new Date(yesterday);
      start.setHours(0, 0, 0, 0);
      end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      break;
    }

    case '7d':
      validPeriod = '7d';
      start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;

    case '30d':
      validPeriod = '30d';
      start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;

    case 'month':
      validPeriod = 'month';
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;

    case 'custom':
      validPeriod = 'custom';
      if (customStart && !isNaN(Date.parse(customStart))) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      } else {
        start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
      }

      if (customEnd && !isNaN(Date.parse(customEnd))) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      break;

    default:
      validPeriod = '30d';
      start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
  }

  // Ensure start <= end
  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  // Build sequential list of YYYY-MM-DD dates in the range (up to 90 days max for chart sanity)
  const daysList: string[] = [];
  const cur = new Date(start);
  while (cur <= end && daysList.length <= 90) {
    daysList.push(formatDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return {
    period: validPeriod,
    start,
    end,
    startDateStr: formatDateStr(start),
    endDateStr: formatDateStr(end),
    daysList,
  };
}

/**
 * Calculates conversion rate safely (0 when clicks === 0)
 */
export function calculateConversionRate(orders: number, clicks: number): number {
  if (!clicks || clicks <= 0) return 0;
  if (!orders || orders <= 0) return 0;
  const rate = (orders / clicks) * 100;
  return Number(rate.toFixed(2));
}

/**
 * Fetch KPI metrics and time-series for the Amazon Affiliate Analytics dashboard
 */
export async function getAffiliateAnalyticsData(options: {
  marketplace?: string;
  period?: string;
  startDate?: string | null;
  endDate?: string | null;
  trackingId?: string;
}): Promise<AffiliateAnalyticsResponse> {
  const {
    marketplace = 'Amazon',
    period = '30d',
    startDate,
    endDate,
    trackingId = 'all',
  } = options;

  const range = parseAnalyticsDateRange(period, startDate, endDate);

  // 1. Build Click query for AffiliateClick collection (our real click tracking)
  const clickQuery: Record<string, unknown> = {
    createdAt: { $gte: range.start, $lte: range.end },
  };

  if (marketplace.toLowerCase() !== 'all') {
    clickQuery.marketplace = { $regex: new RegExp(`^${marketplace}$`, 'i') };
  }

  // 2. Build Report query for AffiliateReport collection
  const reportQuery: Record<string, unknown> = {
    date: { $gte: range.start, $lte: range.end },
  };

  if (marketplace.toLowerCase() !== 'all') {
    reportQuery.marketplace = { $regex: new RegExp(`^${marketplace}$`, 'i') };
  }

  if (trackingId && trackingId.toLowerCase() !== 'all') {
    reportQuery.trackingId = trackingId;
  }

  // 3. Fetch real website clicks count and daily click grouping
  const [totalClicks, clicksByDate, reportItems, latestReportDoc] = await Promise.all([
    AffiliateClick.countDocuments(clickQuery),
    AffiliateClick.aggregate([
      { $match: clickQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    AffiliateReport.find(reportQuery).lean(),
    AffiliateReport.findOne(
      marketplace.toLowerCase() !== 'all'
        ? { marketplace: { $regex: new RegExp(`^${marketplace}$`, 'i') } }
        : {}
    )
      .sort({ date: -1 })
      .lean(),
  ]);

  // Map clicks by date
  const clickMap = new Map<string, number>();
  for (const c of clicksByDate) {
    if (c._id) {
      clickMap.set(c._id, c.count);
    }
  }

  // 4. Aggregate report data (sum orders, shipped, sales, earnings)
  let reportClicks = 0;
  let orders = 0;
  let itemsShipped = 0;
  let sales = 0;
  let earnings = 0;

  const reportDataByDate = new Map<
    string,
    { orders: number; earnings: number; sales: number; clicks: number }
  >();

  for (const item of reportItems) {
    const dStr = item.dateString || formatDateStr(new Date(item.date));

    orders += item.orderedItems || 0;
    itemsShipped += item.shippedItems || 0;
    sales += item.sales || 0;
    earnings += item.earnings || 0;
    reportClicks += item.clicks || 0;

    const existing = reportDataByDate.get(dStr) || {
      orders: 0,
      earnings: 0,
      sales: 0,
      clicks: 0,
    };

    existing.orders += item.orderedItems || 0;
    existing.earnings += item.earnings || 0;
    existing.sales += item.sales || 0;
    existing.clicks += item.clicks || 0;

    reportDataByDate.set(dStr, existing);
  }

  const conversionRate = calculateConversionRate(orders, totalClicks);

  // 5. Construct smooth time-series with zero-filling
  const timeSeries: TimeSeriesPoint[] = range.daysList.map((dStr) => {
    const rep = reportDataByDate.get(dStr);
    const dateObj = new Date(dStr + 'T00:00:00');
    const label = dateObj.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });

    return {
      date: dStr,
      label,
      clicks: clickMap.get(dStr) || 0,
      orders: rep?.orders || 0,
      earnings: Math.round((rep?.earnings || 0) * 100) / 100,
      sales: Math.round((rep?.sales || 0) * 100) / 100,
    };
  });

  const hasReportData = reportItems.length > 0;
  let dataSource = 'Website Click Tracker (No Amazon Associates report connected yet)';
  if (hasReportData) {
    const isApiSync = reportItems.some((r) => r.source === 'api_sync');
    dataSource = isApiSync
      ? 'Amazon Associates API / Approved Integration'
      : 'Imported Amazon Associates Report';
  }

  return {
    kpis: {
      clicks: totalClicks,
      amazonReportedClicks: reportClicks,
      orders,
      itemsShipped,
      conversionRate,
      sales: Math.round(sales * 100) / 100,
      earnings: Math.round(earnings * 100) / 100,
    },
    timeSeries,
    meta: {
      marketplace,
      period: range.period,
      startDate: range.startDateStr,
      endDate: range.endDateStr,
      trackingId,
      dataSource,
      hasReportData,
      lastReportDate: latestReportDoc
        ? formatDateStr(new Date(latestReportDoc.date))
        : null,
      lastImportedAt: latestReportDoc?.createdAt
        ? new Date(latestReportDoc.createdAt).toISOString()
        : null,
    },
  };
}

/**
 * Fetch product-level affiliate performance merging real click data with report data
 */
export async function getAffiliateProductPerformance(options: {
  marketplace?: string;
  period?: string;
  startDate?: string | null;
  endDate?: string | null;
  trackingId?: string;
  sortBy?: 'clicks' | 'sales' | 'earnings' | 'orders';
  limit?: number;
}): Promise<{ products: ProductPerformanceItem[]; hasProductReportData: boolean }> {
  const {
    marketplace = 'Amazon',
    period = '30d',
    startDate,
    endDate,
    trackingId = 'all',
    sortBy = 'clicks',
    limit = 20,
  } = options;

  const range = parseAnalyticsDateRange(period, startDate, endDate);

  // 1. Click query
  const clickQuery: Record<string, unknown> = {
    createdAt: { $gte: range.start, $lte: range.end },
    productSlug: { $exists: true, $ne: '' },
  };

  if (marketplace.toLowerCase() !== 'all') {
    clickQuery.marketplace = { $regex: new RegExp(`^${marketplace}$`, 'i') };
  }

  // 2. Report query (looking for product-specific items with productSlug or asin)
  const reportQuery: Record<string, unknown> = {
    date: { $gte: range.start, $lte: range.end },
    $or: [
      { productSlug: { $exists: true, $ne: '' } },
      { asin: { $exists: true, $ne: '' } },
    ],
  };

  if (marketplace.toLowerCase() !== 'all') {
    reportQuery.marketplace = { $regex: new RegExp(`^${marketplace}$`, 'i') };
  }

  if (trackingId && trackingId.toLowerCase() !== 'all') {
    reportQuery.trackingId = trackingId;
  }

  const [clicksByProduct, reportProducts] = await Promise.all([
    AffiliateClick.aggregate([
      { $match: clickQuery },
      {
        $group: {
          _id: '$productSlug',
          productName: { $first: '$productName' },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 100 },
    ]),
    AffiliateReport.find(reportQuery).lean(),
  ]);

  // Cross-link clicks and report records by resolving ASINs and product slugs against catalog
  const clickSlugs = clicksByProduct.map((c) => String(c._id)).filter(Boolean);
  const reportAsins = reportProducts.map((r) => r.asin).filter(Boolean) as string[];

  const orConditions: Record<string, unknown>[] = [];
  if (clickSlugs.length > 0) orConditions.push({ slug: { $in: clickSlugs } });
  if (reportAsins.length > 0) orConditions.push({ 'marketplaces.externalProductId': { $in: reportAsins } });

  const asinToSlugMap = new Map<string, string>();
  const slugToAsinMap = new Map<string, string>();
  const slugToNameMap = new Map<string, string>();

  if (orConditions.length > 0) {
    const matchingProducts = await Product.find({ $or: orConditions })
      .select('slug name marketplaces')
      .lean();

    for (const p of matchingProducts) {
      if (p.name) slugToNameMap.set(p.slug, p.name);
      if (p.marketplaces && Array.isArray(p.marketplaces)) {
        for (const m of p.marketplaces) {
          if (m.externalProductId) {
            asinToSlugMap.set(m.externalProductId, p.slug);
            slugToAsinMap.set(p.slug, m.externalProductId);
          }
        }
      }
    }
  }

  const productMap = new Map<string, ProductPerformanceItem>();

  // Initialize with real clicks from website tracker
  for (const c of clicksByProduct) {
    if (!c._id) continue;
    const slug = String(c._id);
    const asin = slugToAsinMap.get(slug);
    const productName = slugToNameMap.get(slug) || c.productName || slug;

    productMap.set(slug, {
      productSlug: slug,
      asin,
      productName,
      clicks: c.clicks || 0,
      orders: 0,
      itemsShipped: 0,
      sales: 0,
      earnings: 0,
      conversionRate: 0,
      hasReportData: false,
    });
  }

  // Merge with verified report product items
  let hasProductReportData = false;

  for (const rep of reportProducts) {
    hasProductReportData = true;
    const matchedSlug = rep.productSlug || (rep.asin ? asinToSlugMap.get(rep.asin) : undefined);
    const key = matchedSlug || rep.asin || rep.productName || 'unknown-item';

    const existing = productMap.get(key) || {
      productSlug: matchedSlug || rep.productSlug || rep.asin || 'external-asin',
      asin: rep.asin || (matchedSlug ? slugToAsinMap.get(matchedSlug) : undefined),
      productName:
        (matchedSlug ? slugToNameMap.get(matchedSlug) : undefined) ||
        rep.productName ||
        rep.asin ||
        'Amazon Item',
      category: rep.category,
      clicks: 0,
      orders: 0,
      itemsShipped: 0,
      sales: 0,
      earnings: 0,
      conversionRate: 0,
      hasReportData: true,
    };

    existing.orders += rep.orderedItems || 0;
    existing.itemsShipped += rep.shippedItems || 0;
    existing.sales += rep.sales || 0;
    existing.earnings += rep.earnings || 0;
    if (rep.asin && !existing.asin) existing.asin = rep.asin;
    if (rep.category && !existing.category) existing.category = rep.category;
    existing.hasReportData = true;

    productMap.set(key, existing);
  }

  // Calculate conversion rates
  const allProducts = Array.from(productMap.values()).map((p) => ({
    ...p,
    sales: Math.round(p.sales * 100) / 100,
    earnings: Math.round(p.earnings * 100) / 100,
    conversionRate: calculateConversionRate(p.orders, p.clicks),
  }));

  // Sort deterministically
  allProducts.sort((a, b) => {
    switch (sortBy) {
      case 'sales':
        return b.sales - a.sales || b.clicks - a.clicks;
      case 'earnings':
        return b.earnings - a.earnings || b.clicks - a.clicks;
      case 'orders':
        return b.orders - a.orders || b.clicks - a.clicks;
      case 'clicks':
      default:
        return b.clicks - a.clicks || b.orders - a.orders;
    }
  });

  return {
    products: allProducts.slice(0, limit),
    hasProductReportData,
  };
}

/**
 * Fetch available Amazon/partner tracking IDs configured in env or stored in reports
 */
export async function getAvailableTrackingIds(
  marketplace: string = 'Amazon'
): Promise<string[]> {
  const idsSet = new Set<string>();

  // Check environment variable
  if (
    (marketplace.toLowerCase() === 'amazon' || marketplace.toLowerCase() === 'all') &&
    process.env.AMAZON_ASSOCIATE_TAG
  ) {
    idsSet.add(process.env.AMAZON_ASSOCIATE_TAG.trim());
  }

  // Query distinct tracking IDs from reports
  const query: Record<string, unknown> = {};
  if (marketplace.toLowerCase() !== 'all') {
    query.marketplace = { $regex: new RegExp(`^${marketplace}$`, 'i') };
  }

  const distinctIds = await AffiliateReport.distinct('trackingId', query);
  for (const id of distinctIds) {
    if (id && typeof id === 'string' && id !== 'default') {
      idsSet.add(id.trim());
    }
  }

  return Array.from(idsSet);
}

/**
 * Clean numeric string from currency symbols (₹, $), commas, etc.
 */
function cleanNumeric(val: unknown): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/[₹$,\s%]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse and import an Amazon Associates Report CSV or JSON into AffiliateReport
 */
export async function importAffiliateReport(
  csvContent: string,
  options: {
    marketplace?: MarketplaceName;
    defaultTrackingId?: string;
    rawReportName?: string;
  } = {}
): Promise<{
  success: boolean;
  importedCount: number;
  totalOrders: number;
  totalEarnings: number;
  errors: string[];
}> {
  const marketplace: MarketplaceName = options.marketplace || 'Amazon';
  const defaultTrackingId =
    options.defaultTrackingId || process.env.AMAZON_ASSOCIATE_TAG || 'onlinesalelive-21';
  const rawReportName = options.rawReportName || 'Amazon_Associates_Report.csv';

  if (!csvContent || !csvContent.trim()) {
    return {
      success: false,
      importedCount: 0,
      totalOrders: 0,
      totalEarnings: 0,
      errors: ['Report file is empty'],
    };
  }

  // Parse CSV
  const parsed = Papa.parse<Record<string, string>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ''),
  });

  if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      success: false,
      importedCount: 0,
      totalOrders: 0,
      totalEarnings: 0,
      errors: [`CSV Parsing error: ${parsed.errors[0].message}`],
    };
  }

  let importedCount = 0;
  let totalOrders = 0;
  let totalEarnings = 0;
  const errors: string[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNum = i + 2;

    // Detect Date column
    const rawDate =
      row.date || row.day || row.transactiondate || row.orderdate || '';
    if (!rawDate) {
      // Skip empty or summary footer rows (e.g. "Total")
      continue;
    }

    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`Row ${rowNum}: Invalid date '${rawDate}'`);
      continue;
    }

    const dateStr = formatDateStr(parsedDate);

    // Detect Tracking ID
    const trackingId =
      row.trackingid || row.tag || row.associateid || defaultTrackingId;

    // Detect numeric fields
    const clicks = cleanNumeric(row.clicks || row.referrals);
    const orderedItems = cleanNumeric(row.ordereditems || row.orders || row.itemsordered);
    const shippedItems = cleanNumeric(row.shippeditems || row.itemsshipped || orderedItems);
    const returnedItems = cleanNumeric(row.returneditems || row.refunds);
    const sales = cleanNumeric(
      row.sales ||
        row.revenue ||
        row.shippedrevenue ||
        row.shippeditemsrevenue ||
        row.orderedrevenue ||
        row.itemrevenue
    );
    const earnings = cleanNumeric(row.earnings || row.commission || row.totalearnings || row.advertisingfee);

    // Product fields (if product-level report)
    const asin = row.asin || row.itemid || row.productid || undefined;
    const productName = row.productname || row.itemname || row.title || undefined;
    const category = row.category || row.department || undefined;

    // Attempt to match productSlug if ASIN is provided
    let productSlug: string | undefined;
    if (asin) {
      const match = await Product.findOne({
        'marketplaces.externalProductId': asin.trim(),
      }).select('slug');
      if (match) {
        productSlug = match.slug;
      }
    }

    const conversionRate = calculateConversionRate(orderedItems, clicks);

    // Upsert by date + trackingId + asin to prevent duplicate records
    const filterKey: Record<string, unknown> = {
      marketplace,
      dateString: dateStr,
      trackingId,
    };
    if (asin) {
      filterKey.asin = asin;
    } else {
      filterKey.asin = { $exists: false };
    }

    await AffiliateReport.findOneAndUpdate(
      filterKey,
      {
        $set: {
          marketplace,
          trackingId,
          date: parsedDate,
          dateString: dateStr,
          clicks,
          orderedItems,
          shippedItems,
          returnedItems,
          sales,
          earnings,
          conversionRate,
          source: 'imported_report',
          rawReportName,
          ...(asin ? { asin } : {}),
          ...(productName ? { productName } : {}),
          ...(productSlug ? { productSlug } : {}),
          ...(category ? { category } : {}),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    importedCount++;
    totalOrders += orderedItems;
    totalEarnings += earnings;
  }

  return {
    success: importedCount > 0,
    importedCount,
    totalOrders,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    errors,
  };
}
