import { connectToDatabase } from '@/lib/db';
import { AffiliateClick } from '@/models/AffiliateClick';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET() {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const [
      totalClicks,
      affiliateClicks,
      clicksByMarketplace,
      topProducts,
      recentClicks,
    ] = await Promise.all([
      AffiliateClick.countDocuments(),
      AffiliateClick.countDocuments({ isAffiliate: true }),
      AffiliateClick.aggregate([
        { $group: { _id: '$marketplace', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AffiliateClick.aggregate([
        { $match: { productSlug: { $exists: true, $ne: '' } } },
        {
          $group: {
            _id: '$productSlug',
            name: { $first: '$productName' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      AffiliateClick.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    const standardClicks = totalClicks - affiliateClicks;

    return successResponse({
      totalClicks,
      affiliateClicks,
      standardClicks,
      clicksByMarketplace: clicksByMarketplace.map((m) => ({
        marketplace: m._id,
        count: m.count,
      })),
      topProducts: topProducts.map((p) => ({
        slug: p._id,
        name: p.name || p._id,
        count: p.count,
      })),
      recentClicks: recentClicks.map((c) => ({
        id: String(c._id),
        marketplace: c.marketplace,
        productName: c.productName,
        productSlug: c.productSlug,
        destinationUrl: c.destinationUrl,
        isAffiliate: c.isAffiliate,
        sourcePage: c.sourcePage,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error fetching affiliate analytics:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to load click analytics', 500);
  }
}
