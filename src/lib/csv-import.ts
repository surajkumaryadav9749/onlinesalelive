import Papa from 'papaparse';
import { Types } from 'mongoose';
import { Product, IProduct, IMarketplaceOffer } from '@/models/Product';
import { Category, ICategory } from '@/models/Category';
import { DealType } from '@/types';
import { isAllowedMarketplaceUrl, SUPPORTED_MARKETPLACES } from '@/lib/marketplaces';
import { revalidateCatalog } from '@/lib/revalidate';

export const MAX_CSV_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMPORT_ROWS = 500;

export const CSV_COLUMNS = [
  'name',
  'slug',
  'category',
  'description',
  'image',
  'images',
  'price',
  'originalPrice',
  'discountPercent',
  'rating',
  'reviewCount',
  'dealType',
  'dealStatus',
  'isFeatured',
  'isTrending',
  'isActive',
  'pros',
  'cons',
  'marketplace',
  'asin',
  'standardUrl',
  'affiliateUrl',
  'offerPrice',
  'marketplaceOriginalPrice',
  'coupon',
  'inStock',
  'marketplaceActive',
  'affiliateEnabled',
] as const;

export type CsvColumnName = (typeof CSV_COLUMNS)[number];

export const VALID_DEAL_TYPES: DealType[] = [
  "Today's Deal",
  'Sale',
  'Major Discount',
  'Flash Deal',
  'Price Drop',
  'Featured Deal',
];

export const VALID_DEAL_STATUSES = ['active', 'upcoming', 'expired'] as const;

export interface RawCsvRow {
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  image?: string;
  images?: string;
  price?: string;
  originalPrice?: string;
  discountPercent?: string;
  rating?: string;
  reviewCount?: string;
  dealType?: string;
  dealStatus?: string;
  isFeatured?: string;
  isTrending?: string;
  isActive?: string;
  pros?: string;
  cons?: string;
  marketplace?: string;
  asin?: string;
  standardUrl?: string;
  affiliateUrl?: string;
  offerPrice?: string;
  marketplaceOriginalPrice?: string;
  coupon?: string;
  inStock?: string;
  marketplaceActive?: string;
  affiliateEnabled?: string;
  [key: string]: string | undefined;
}

export interface RowError {
  row: number;
  field?: string;
  message: string;
}

export interface ValidatedProductData {
  name: string;
  slug: string;
  category: Types.ObjectId;
  categorySlug: string;
  categoryName: string;
  description: string;
  image: string;
  images: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  dealType: DealType;
  dealStatus: 'active' | 'upcoming' | 'expired';
  isFeatured: boolean;
  isTrending: boolean;
  isActive: boolean;
  pros: string[];
  cons: string[];
  marketplaceOffer?: IMarketplaceOffer;
  source: 'csv_import';
}

export type RowStatus = 'valid' | 'duplicate' | 'invalid' | 'will_update';

export interface RowValidationResult {
  rowNumber: number;
  data: RawCsvRow;
  status: RowStatus;
  errors: string[];
  parsed?: ValidatedProductData;
  existingId?: string;
  duplicateReason?: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: RowError[];
  preview: Array<{
    rowNumber: number;
    name: string;
    category: string;
    price: number | string;
    originalPrice: number | string;
    rating: number | string;
    marketplace: string;
    asin: string;
    affiliateStatus: 'Added' | 'Not Added';
    status: RowStatus;
    statusText: string;
    errors: string[];
  }>;
  rows: RowValidationResult[];
}

export interface ImportExecutionResult {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: RowError[];
}

/**
 * Escapes values against CSV formula injection (starts with =, +, -, @, \t, \r)
 */
export function sanitizeCsvFormula(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Generate standard slug from product name (matching project slug generation logic)
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Safely parse boolean values case-insensitively (true, false, yes, no, 1, 0)
 */
export function parseBoolean(
  value: unknown,
  fieldName: string,
  defaultValue?: boolean
): { value: boolean; error?: string } {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (defaultValue !== undefined) {
      return { value: defaultValue };
    }
    return {
      value: false,
      error: `Missing required boolean value for ${fieldName}`,
    };
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', 'yes', '1'].includes(normalized)) {
    return { value: true };
  }
  if (['false', 'no', '0'].includes(normalized)) {
    return { value: false };
  }

  return {
    value: false,
    error: `Invalid boolean '${value}' for ${fieldName}. Allowed values: true, false, yes, no, 1, 0.`,
  };
}

/**
 * Parse pipe-separated string into an array of trimmed non-empty strings
 */
export function parsePipeSeparated(value: unknown): string[] {
  if (!value || typeof value !== 'string') return [];
  return value
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Example row for the downloadable CSV template
 */
export const EXAMPLE_CSV_ROW: Record<CsvColumnName, string> = {
  name: 'HAMMER Airflow Neo Earbuds with 80H Playtime',
  slug: 'hammer-airflow-neo-earbuds-80h-grey',
  category: 'Wireless Accessories',
  description:
    'HAMMER Airflow Neo is a truly wireless earbud with up to 80 hours of playtime, 13mm titanium drivers, 40ms gaming mode, fast charging, Type-C charging and voice assistant support.',
  image: '',
  images: '',
  price: '599',
  originalPrice: '2499',
  discountPercent: '76',
  rating: '4.0',
  reviewCount: '1963',
  dealType: 'Price Drop',
  dealStatus: 'active',
  isFeatured: 'false',
  isTrending: 'false',
  isActive: 'true',
  pros: 'Up to 80 hours of playtime|13mm titanium driver|40ms gaming mode|Fast charging|Type-C charging|Voice assistant support',
  cons: '',
  marketplace: 'Amazon',
  asin: 'B0GDTRYXYF',
  standardUrl: 'https://www.amazon.in/dp/B0GDTRYXYF',
  affiliateUrl: '',
  offerPrice: '599',
  marketplaceOriginalPrice: '2499',
  coupon: '',
  inStock: 'true',
  marketplaceActive: 'true',
  affiliateEnabled: 'false',
};

/**
 * Generates the CSV template with headers and the example row
 */
export function generateCsvTemplate(): string {
  const headers = CSV_COLUMNS.join(',');
  const exampleRow = CSV_COLUMNS.map((col) => {
    const val = EXAMPLE_CSV_ROW[col] || '';
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }).join(',');

  return `${headers}\n${exampleRow}\n`;
}

/**
 * Parses raw CSV string using PapaParse, enforcing RFC 4180 quotes, delimiters, newlines, and limits
 */
export function parseCsvString(csvString: string): {
  rows: RawCsvRow[];
  error?: string;
} {
  if (!csvString || !csvString.trim()) {
    return { rows: [], error: 'CSV file is empty' };
  }

  // Handle potential UTF-8 Byte Order Mark (BOM)
  const cleanCsv = csvString.charCodeAt(0) === 0xfeff ? csvString.slice(1) : csvString;

  const parsed = Papa.parse<RawCsvRow>(cleanCsv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header: string) => header.trim(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    // Only return fatal error if no data parsed
    if (parsed.data.length === 0) {
      return {
        rows: [],
        error: `CSV Parsing Error: ${parsed.errors[0].message} (line ${parsed.errors[0].row || 1})`,
      };
    }
  }

  if (parsed.data.length === 0) {
    return { rows: [], error: 'No data rows found in CSV' };
  }

  if (parsed.data.length > MAX_IMPORT_ROWS) {
    return {
      rows: [],
      error: `CSV exceeds maximum limit of ${MAX_IMPORT_ROWS} rows (found ${parsed.data.length} rows)`,
    };
  }

  return { rows: parsed.data };
}

/**
 * Validates parsed CSV rows against database constraints, formats, categories, and duplicates
 */
export async function validateCsvRows(
  rows: RawCsvRow[],
  options: { updateExisting: boolean }
): Promise<ValidationSummary> {
  const { updateExisting } = options;

  // 1. Preload categories into lookup maps (case-insensitive name and slug)
  const allCategories: ICategory[] = await Category.find({}).lean();
  const categoryMapByName = new Map<string, ICategory>();
  const categoryMapBySlug = new Map<string, ICategory>();

  for (const cat of allCategories) {
    categoryMapByName.set(cat.name.trim().toLowerCase(), cat);
    categoryMapBySlug.set(cat.slug.trim().toLowerCase(), cat);
  }

  // 2. Intra-batch duplicate tracking
  const seenAsinsInBatch = new Map<string, number>(); // key: `${marketplace}:${asin}`, value: rowNumber
  const seenSlugsInBatch = new Map<string, number>(); // key: slug, value: rowNumber

  const rowResults: RowValidationResult[] = [];
  const errorsList: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // Row 1 is the header
    const rowErrors: string[] = [];

    // --- Product Name ---
    const rawName = row.name ? String(row.name).trim() : '';
    if (!rawName) {
      rowErrors.push('Missing product name');
    }

    // --- Slug ---
    let finalSlug = '';
    const rawSlug = row.slug ? String(row.slug).trim() : '';
    if (rawSlug) {
      finalSlug = generateSlug(rawSlug);
      if (!finalSlug) {
        rowErrors.push('Invalid product slug');
      }
    } else if (rawName) {
      finalSlug = generateSlug(rawName);
      if (!finalSlug) {
        rowErrors.push('Could not generate a valid slug from product name');
      }
    }

    // --- Category Lookup ---
    const rawCategory = row.category ? String(row.category).trim() : '';
    let categoryDoc: ICategory | undefined;
    if (!rawCategory) {
      rowErrors.push('Missing category');
    } else {
      const normalizedCat = rawCategory.toLowerCase();
      categoryDoc = categoryMapByName.get(normalizedCat) || categoryMapBySlug.get(normalizedCat);
      if (!categoryDoc) {
        rowErrors.push(`Category '${rawCategory}' does not exist.`);
      }
    }

    // --- Price & OriginalPrice ---
    const rawPrice = row.price !== undefined ? String(row.price).trim() : '';
    let priceNum = 0;
    if (rawPrice === '') {
      rowErrors.push('Price is required');
    } else {
      priceNum = Number(rawPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        rowErrors.push('Invalid price: must be a valid number >= 0');
      }
    }

    const rawOrigPrice = row.originalPrice !== undefined ? String(row.originalPrice).trim() : '';
    let origPriceNum = priceNum;
    if (rawOrigPrice === '') {
      // Default to priceNum if not provided
      origPriceNum = priceNum;
    } else {
      origPriceNum = Number(rawOrigPrice);
      if (isNaN(origPriceNum) || origPriceNum < 0) {
        rowErrors.push('Invalid original price: must be a valid number >= 0');
      }
    }

    // --- Discount Percent ---
    let discountPercent = 0;
    const rawDiscount = row.discountPercent !== undefined ? String(row.discountPercent).trim() : '';
    if (rawDiscount !== '') {
      discountPercent = Number(rawDiscount);
      if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
        rowErrors.push('Invalid discount percentage: must be between 0 and 100');
      }
    } else {
      if (origPriceNum > priceNum && origPriceNum > 0) {
        discountPercent = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
      }
    }

    // --- Rating ---
    let ratingNum = 4.0;
    const rawRating = row.rating !== undefined ? String(row.rating).trim() : '';
    if (rawRating !== '') {
      ratingNum = Number(rawRating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        rowErrors.push('Invalid rating: must be between 0 and 5');
      }
    }

    // --- Review Count ---
    let reviewCountNum = 0;
    const rawReviewCount = row.reviewCount !== undefined ? String(row.reviewCount).trim() : '';
    if (rawReviewCount !== '') {
      reviewCountNum = Number(rawReviewCount);
      if (isNaN(reviewCountNum) || reviewCountNum < 0) {
        rowErrors.push('Invalid review count: must be a non-negative number');
      }
    }

    // --- Deal Type ---
    let finalDealType: DealType = "Today's Deal";
    const rawDealType = row.dealType ? String(row.dealType).trim() : '';
    if (rawDealType) {
      const match = VALID_DEAL_TYPES.find(
        (dt) => dt.toLowerCase() === rawDealType.toLowerCase()
      );
      if (match) {
        finalDealType = match;
      } else {
        rowErrors.push(
          `Invalid deal type '${rawDealType}'. Allowed: ${VALID_DEAL_TYPES.join(', ')}`
        );
      }
    }

    // --- Deal Status ---
    let finalDealStatus: 'active' | 'upcoming' | 'expired' = 'active';
    const rawDealStatus = row.dealStatus ? String(row.dealStatus).trim().toLowerCase() : '';
    if (rawDealStatus) {
      if (VALID_DEAL_STATUSES.includes(rawDealStatus as 'active' | 'upcoming' | 'expired')) {
        finalDealStatus = rawDealStatus as 'active' | 'upcoming' | 'expired';
      } else {
        rowErrors.push(
          `Invalid deal status '${row.dealStatus}'. Allowed: ${VALID_DEAL_STATUSES.join(', ')}`
        );
      }
    }

    // --- Booleans ---
    const isFeaturedRes = parseBoolean(row.isFeatured, 'isFeatured', false);
    if (isFeaturedRes.error) rowErrors.push(isFeaturedRes.error);

    const isTrendingRes = parseBoolean(row.isTrending, 'isTrending', false);
    if (isTrendingRes.error) rowErrors.push(isTrendingRes.error);

    const isActiveRes = parseBoolean(row.isActive, 'isActive', true);
    if (isActiveRes.error) rowErrors.push(isActiveRes.error);

    const inStockRes = parseBoolean(row.inStock, 'inStock', true);
    if (inStockRes.error) rowErrors.push(inStockRes.error);

    const marketplaceActiveRes = parseBoolean(
      row.marketplaceActive,
      'marketplaceActive',
      true
    );
    if (marketplaceActiveRes.error) rowErrors.push(marketplaceActiveRes.error);

    const affiliateEnabledRes = parseBoolean(
      row.affiliateEnabled,
      'affiliateEnabled',
      false
    );
    if (affiliateEnabledRes.error) rowErrors.push(affiliateEnabledRes.error);

    // --- Array Fields ---
    const pros = parsePipeSeparated(row.pros);
    const cons = parsePipeSeparated(row.cons);
    const image = row.image ? String(row.image).trim() : '';
    const imagesFromPipe = parsePipeSeparated(row.images);
    const finalImages = imagesFromPipe.length > 0 ? imagesFromPipe : image ? [image] : [];

    // --- Marketplace Listing Fields ---
    let marketplaceOffer: IMarketplaceOffer | undefined;
    const rawMarketplace = row.marketplace ? String(row.marketplace).trim() : '';
    const rawAsin = row.asin ? String(row.asin).trim().toUpperCase() : '';
    const rawStandardUrl = row.standardUrl ? String(row.standardUrl).trim() : '';
    const rawAffiliateUrl = row.affiliateUrl ? String(row.affiliateUrl).trim() : '';

    if (rawMarketplace || rawAsin || rawStandardUrl) {
      // Find matched marketplace
      const matchedMarketplace = SUPPORTED_MARKETPLACES.find(
        (m) => m.toLowerCase() === (rawMarketplace || 'Amazon').toLowerCase()
      );

      if (!matchedMarketplace) {
        rowErrors.push(
          `Marketplace '${rawMarketplace}' is not supported. Supported: ${SUPPORTED_MARKETPLACES.join(', ')}`
        );
      } else {
        // Amazon ASIN check
        if (matchedMarketplace === 'Amazon' && !rawAsin && !rawStandardUrl) {
          rowErrors.push('ASIN or standardUrl is required for Amazon listings');
        }

        // Standard URL validation
        let finalStandardUrl = rawStandardUrl;
        if (!finalStandardUrl && matchedMarketplace === 'Amazon' && rawAsin) {
          finalStandardUrl = `https://www.amazon.in/dp/${rawAsin}`;
        }

        if (finalStandardUrl) {
          if (!isAllowedMarketplaceUrl(matchedMarketplace, finalStandardUrl)) {
            rowErrors.push(
              `Invalid standardUrl '${finalStandardUrl}' for marketplace '${matchedMarketplace}'. Must be an authorized HTTPS domain.`
            );
          }
        } else {
          finalStandardUrl = '#';
        }

        // Affiliate URL validation
        let finalAffiliateUrl = '';
        let isAffiliate = false;

        if (rawAffiliateUrl) {
          if (!isAllowedMarketplaceUrl(matchedMarketplace, rawAffiliateUrl)) {
            rowErrors.push(
              `Invalid affiliateUrl '${rawAffiliateUrl}' for marketplace '${matchedMarketplace}'. Must be an authorized HTTPS domain.`
            );
          } else {
            finalAffiliateUrl = rawAffiliateUrl;
            isAffiliate = affiliateEnabledRes.value;
          }
        } else {
          // Empty affiliateUrl -> affiliateEnabled MUST be false
          finalAffiliateUrl = '';
          isAffiliate = false;
        }

        const rawOfferPrice =
          row.offerPrice !== undefined ? String(row.offerPrice).trim() : '';
        const offerPriceNum =
          rawOfferPrice !== '' && !isNaN(Number(rawOfferPrice))
            ? Number(rawOfferPrice)
            : priceNum;

        const rawMarketplaceOrigPrice =
          row.marketplaceOriginalPrice !== undefined
            ? String(row.marketplaceOriginalPrice).trim()
            : '';
        const marketplaceOrigPriceNum =
          rawMarketplaceOrigPrice !== '' && !isNaN(Number(rawMarketplaceOrigPrice))
            ? Number(rawMarketplaceOrigPrice)
            : origPriceNum;

        const couponText = row.coupon ? String(row.coupon).trim() : '';

        marketplaceOffer = {
          name: matchedMarketplace,
          price: offerPriceNum,
          originalPrice: marketplaceOrigPriceNum,
          url: finalStandardUrl,
          affiliateUrl: finalAffiliateUrl,
          isAffiliate,
          isActive: marketplaceActiveRes.value,
          inStock: inStockRes.value,
          lastUpdated: new Date(),
          externalProductId: rawAsin || undefined,
          couponCode: couponText || undefined,
          couponText: couponText || undefined,
        };
      }
    }

    // --- Intra-batch Duplicate Check ---
    if (rawAsin && marketplaceOffer?.name) {
      const asinKey = `${marketplaceOffer.name}:${rawAsin}`;
      if (seenAsinsInBatch.has(asinKey)) {
        const prevRow = seenAsinsInBatch.get(asinKey);
        rowErrors.push(
          `Duplicate ASIN '${rawAsin}' in CSV (already present in Row ${prevRow})`
        );
      } else {
        seenAsinsInBatch.set(asinKey, rowNumber);
      }
    }

    if (finalSlug) {
      if (seenSlugsInBatch.has(finalSlug)) {
        const prevRow = seenSlugsInBatch.get(finalSlug);
        rowErrors.push(
          `Duplicate slug '${finalSlug}' in CSV (already present in Row ${prevRow})`
        );
      } else {
        seenSlugsInBatch.set(finalSlug, rowNumber);
      }
    }

    // --- Construct Validated Product Data if no field errors ---
    let parsedProduct: ValidatedProductData | undefined;
    if (categoryDoc && finalSlug && rawName) {
      parsedProduct = {
        name: rawName,
        slug: finalSlug,
        category: categoryDoc._id as Types.ObjectId,
        categorySlug: categoryDoc.slug,
        categoryName: categoryDoc.name,
        description: row.description ? String(row.description).trim() : '',
        image,
        images: finalImages,
        price: priceNum,
        originalPrice: origPriceNum,
        discountPercent,
        rating: ratingNum,
        reviewCount: reviewCountNum,
        dealType: finalDealType,
        dealStatus: finalDealStatus,
        isFeatured: isFeaturedRes.value,
        isTrending: isTrendingRes.value,
        isActive: isActiveRes.value,
        pros,
        cons,
        marketplaceOffer,
        source: 'csv_import',
      };
    }

    // --- Database Duplicate / Update Check ---
    let status: RowStatus = rowErrors.length > 0 ? 'invalid' : 'valid';
    let existingId: string | undefined;
    let duplicateReason: string | undefined;

    if (rowErrors.length === 0 && parsedProduct) {
      // Check duplicate in DB by ASIN (with same marketplace) or by Slug
      const dbQuery: Record<string, unknown>[] = [{ slug: parsedProduct.slug }];
      if (rawAsin && marketplaceOffer?.name) {
        dbQuery.push({
          'marketplaces.externalProductId': rawAsin,
          'marketplaces.name': marketplaceOffer.name,
        });
      }

      const existingProd = await Product.findOne({ $or: dbQuery });

      if (existingProd) {
        existingId = String(existingProd._id);
        const asinMatched =
          rawAsin &&
          existingProd.marketplaces?.some(
            (m) =>
              m.externalProductId === rawAsin &&
              m.name === marketplaceOffer?.name
          );

        if (asinMatched) {
          duplicateReason = `Product with ASIN ${rawAsin} already exists (${existingProd.name})`;
        } else {
          duplicateReason = `Product with slug '${parsedProduct.slug}' already exists (${existingProd.name})`;
        }

        if (updateExisting) {
          status = 'will_update';
        } else {
          status = 'duplicate';
          rowErrors.push(duplicateReason);
        }
      }
    }

    // Record row error objects
    for (const msg of rowErrors) {
      errorsList.push({ row: rowNumber, message: msg });
    }

    rowResults.push({
      rowNumber,
      data: row,
      status,
      errors: rowErrors,
      parsed: parsedProduct,
      existingId,
      duplicateReason,
    });
  }

  // Count summaries
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  for (const r of rowResults) {
    if (r.status === 'valid' || r.status === 'will_update') {
      validCount++;
    } else if (r.status === 'duplicate') {
      duplicateCount++;
    } else {
      invalidCount++;
    }
  }

  const preview = rowResults.map((r) => {
    const raw = r.data;
    const affiliateStatus: 'Added' | 'Not Added' =
      raw.affiliateUrl && String(raw.affiliateUrl).trim() !== ''
        ? 'Added'
        : 'Not Added';

    let statusText = 'Valid';
    if (r.status === 'will_update') statusText = 'Will Update';
    if (r.status === 'duplicate') statusText = 'Duplicate (Skip)';
    if (r.status === 'invalid') statusText = 'Error';

    return {
      rowNumber: r.rowNumber,
      name: raw.name || '(Empty)',
      category: raw.category || '(Empty)',
      price: raw.price || '0',
      originalPrice: raw.originalPrice || raw.price || '0',
      rating: raw.rating || '4.0',
      marketplace: raw.marketplace || (raw.asin ? 'Amazon' : 'None'),
      asin: raw.asin || '-',
      affiliateStatus,
      status: r.status,
      statusText,
      errors: r.errors,
    };
  });

  return {
    totalRows: rows.length,
    validRows: validCount,
    invalidRows: invalidCount,
    duplicateRows: duplicateCount,
    errors: errorsList,
    preview,
    rows: rowResults,
  };
}

/**
 * Executes the database import for validated rows
 */
export async function executeCsvImport(
  validatedRows: RowValidationResult[],
  options: { updateExisting: boolean }
): Promise<ImportExecutionResult> {
  const { updateExisting } = options;

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const executionErrors: RowError[] = [];

  const touchedSlugs: string[] = [];
  const touchedCategorySlugs: string[] = [];

  for (const row of validatedRows) {
    if (row.status === 'duplicate') {
      skippedCount++;
      continue;
    }

    if (row.status === 'invalid' || !row.parsed) {
      failedCount++;
      executionErrors.push({
        row: row.rowNumber,
        message: row.errors.join('; ') || 'Row has validation errors',
      });
      continue;
    }

    const p = row.parsed;

    try {
      if (row.status === 'will_update' && updateExisting && row.existingId) {
        // UPDATE EXISTING PRODUCT
        const existing = await Product.findById(row.existingId);
        if (!existing) {
          failedCount++;
          executionErrors.push({
            row: row.rowNumber,
            message: `Product with ID ${row.existingId} could not be found for update`,
          });
          continue;
        }

        existing.name = p.name;
        if (p.description) existing.description = p.description;
        if (p.image) existing.image = p.image;
        if (p.images.length > 0) existing.images = p.images;
        existing.category = p.category;
        existing.categorySlug = p.categorySlug;
        existing.price = p.price;
        existing.originalPrice = p.originalPrice;
        existing.discountPercent = p.discountPercent;
        existing.rating = p.rating;
        existing.reviewCount = p.reviewCount;
        existing.dealType = p.dealType;
        existing.dealStatus = p.dealStatus;
        existing.isFeatured = p.isFeatured;
        existing.isTrending = p.isTrending;
        existing.isActive = p.isActive;
        existing.source = 'csv_import';

        if (p.pros.length > 0) existing.pros = p.pros;
        if (p.cons.length > 0) existing.cons = p.cons;

        // Marketplace offer update
        if (p.marketplaceOffer) {
          const newOffer = p.marketplaceOffer;
          const currentOffers = existing.marketplaces || [];
          const matchIndex = currentOffers.findIndex(
            (o) => o.name.toLowerCase() === newOffer.name.toLowerCase()
          );

          if (matchIndex >= 0) {
            const rawOffer = currentOffers[matchIndex];
            const existingOffer =
              typeof (rawOffer as unknown as { toObject?: () => IMarketplaceOffer }).toObject ===
              'function'
                ? (rawOffer as unknown as { toObject: () => IMarketplaceOffer }).toObject()
                : (rawOffer as IMarketplaceOffer);

            // CRITICAL BUSINESS REQUIREMENT:
            // NEVER overwrite existing affiliateUrl with an empty CSV value!
            const mergedAffiliateUrl =
              newOffer.affiliateUrl && newOffer.affiliateUrl.trim() !== ''
                ? newOffer.affiliateUrl
                : existingOffer.affiliateUrl || '';

            const mergedIsAffiliate =
              newOffer.affiliateUrl && newOffer.affiliateUrl.trim() !== ''
                ? newOffer.isAffiliate
                : Boolean(existingOffer.isAffiliate);

            currentOffers[matchIndex] = {
              name: existingOffer.name || newOffer.name,
              price: newOffer.price ?? existingOffer.price,
              originalPrice: newOffer.originalPrice ?? existingOffer.originalPrice,
              url: newOffer.url && newOffer.url !== '#' ? newOffer.url : existingOffer.url,
              affiliateUrl: mergedAffiliateUrl,
              isAffiliate: mergedIsAffiliate,
              isActive: newOffer.isActive ?? existingOffer.isActive,
              inStock: newOffer.inStock ?? existingOffer.inStock,
              lastUpdated: new Date(),
              externalProductId:
                newOffer.externalProductId || existingOffer.externalProductId,
              couponCode: newOffer.couponCode || existingOffer.couponCode,
              couponText: newOffer.couponText || existingOffer.couponText,
            };
          } else {
            currentOffers.push(newOffer);
          }
          existing.marketplaces = currentOffers;
        }

        await existing.save();
        updatedCount++;
        touchedSlugs.push(existing.slug);
        touchedCategorySlugs.push(existing.categorySlug);
      } else {
        // CREATE NEW PRODUCT
        const created = await Product.create({
          name: p.name,
          slug: p.slug,
          description: p.description,
          image: p.image,
          images: p.images,
          category: p.category,
          categorySlug: p.categorySlug,
          price: p.price,
          originalPrice: p.originalPrice,
          discountPercent: p.discountPercent,
          rating: p.rating,
          reviewCount: p.reviewCount,
          pros: p.pros,
          cons: p.cons,
          specifications: {},
          marketplaces: p.marketplaceOffer ? [p.marketplaceOffer] : [],
          dealType: p.dealType,
          dealStatus: p.dealStatus,
          isFeatured: p.isFeatured,
          isTrending: p.isTrending,
          badgeText: '',
          isActive: p.isActive,
          source: 'csv_import',
        });

        createdCount++;
        touchedSlugs.push(created.slug);
        touchedCategorySlugs.push(created.categorySlug);
      }
    } catch (err: unknown) {
      failedCount++;
      const msg = err instanceof Error ? err.message : String(err);
      executionErrors.push({ row: row.rowNumber, message: msg });
    }
  }

  // Revalidate catalog for all touched slugs
  try {
    for (let i = 0; i < Math.min(touchedSlugs.length, 5); i++) {
      revalidateCatalog(touchedSlugs[i], touchedCategorySlugs[i]);
    }
    if (touchedSlugs.length === 0) {
      revalidateCatalog();
    }
  } catch (err) {
    console.warn('[CSV Import] Catalog revalidation warning:', err);
  }

  return {
    totalRows: validatedRows.length,
    created: createdCount,
    updated: updatedCount,
    skipped: skippedCount,
    failed: failedCount,
    errors: executionErrors,
  };
}

/**
 * Generate a downloadable Error CSV from validation/execution errors
 */
export function generateErrorCsv(
  rows: RawCsvRow[],
  errors: RowError[]
): string {
  const errorMap = new Map<number, string[]>();
  for (const err of errors) {
    const list = errorMap.get(err.row) || [];
    list.push(err.message);
    errorMap.set(err.row, list);
  }

  const headers = [...CSV_COLUMNS, 'import_errors'];
  const csvLines: string[] = [headers.join(',')];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const rowErrors = errorMap.get(rowNum) || [];
    if (rowErrors.length === 0) continue; // Only include rows with errors

    const rowObj = rows[i];
    const cells = CSV_COLUMNS.map((col) => {
      const val = sanitizeCsvFormula(rowObj[col] || '');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });

    const errorCell = sanitizeCsvFormula(rowErrors.join('; '));
    cells.push(`"${errorCell.replace(/"/g, '""')}"`);
    csvLines.push(cells.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Export existing products to CSV matching the import schema
 */
export async function exportProductsToCsv(): Promise<string> {
  const products: IProduct[] = await Product.find({})
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();

  const lines: string[] = [CSV_COLUMNS.join(',')];

  for (const prod of products) {
    // Pick first marketplace (e.g. Amazon)
    const mp = prod.marketplaces?.[0];

    const categoryObj = prod.category as unknown as { name?: string; slug?: string } | undefined;
    const catName = categoryObj?.name || prod.categorySlug || '';

    const rowData: Record<CsvColumnName, string> = {
      name: sanitizeCsvFormula(prod.name || ''),
      slug: sanitizeCsvFormula(prod.slug || ''),
      category: sanitizeCsvFormula(catName),
      description: sanitizeCsvFormula(prod.description || ''),
      image: sanitizeCsvFormula(prod.image || ''),
      images: sanitizeCsvFormula((prod.images || []).join('|')),
      price: String(prod.price ?? 0),
      originalPrice: String(prod.originalPrice ?? prod.price ?? 0),
      discountPercent: String(prod.discountPercent ?? 0),
      rating: String(prod.rating ?? 4.0),
      reviewCount: String(prod.reviewCount ?? 0),
      dealType: prod.dealType || "Today's Deal",
      dealStatus: prod.dealStatus || 'active',
      isFeatured: prod.isFeatured ? 'true' : 'false',
      isTrending: prod.isTrending ? 'true' : 'false',
      isActive: prod.isActive !== false ? 'true' : 'false',
      pros: sanitizeCsvFormula((prod.pros || []).join('|')),
      cons: sanitizeCsvFormula((prod.cons || []).join('|')),
      marketplace: mp ? mp.name : '',
      asin: sanitizeCsvFormula(mp?.externalProductId || ''),
      standardUrl: sanitizeCsvFormula(mp?.url || ''),
      affiliateUrl: sanitizeCsvFormula(mp?.affiliateUrl || ''),
      offerPrice: mp?.price !== null && mp?.price !== undefined ? String(mp.price) : '',
      marketplaceOriginalPrice:
        mp?.originalPrice !== undefined ? String(mp.originalPrice) : '',
      coupon: sanitizeCsvFormula(mp?.couponCode || mp?.couponText || ''),
      inStock: mp?.inStock !== false ? 'true' : 'false',
      marketplaceActive: mp?.isActive !== false ? 'true' : 'false',
      affiliateEnabled: mp?.isAffiliate ? 'true' : 'false',
    };

    const line = CSV_COLUMNS.map((col) => {
      const val = rowData[col] || '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',');

    lines.push(line);
  }

  return lines.join('\n');
}
