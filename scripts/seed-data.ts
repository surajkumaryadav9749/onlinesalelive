import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import mongoose from 'mongoose';
import { categories as mockCategories } from '../src/data/categories';
import { products as mockProducts } from '../src/data/products';
import { deals as mockDeals } from '../src/data/deals';
import { guides as mockGuides } from '../src/data/guides';
import { reviews as mockReviews } from '../src/data/reviews';
import { blogPosts as mockBlogPosts } from '../src/data/blog';

import { Category } from '../src/models/Category';
import { Product } from '../src/models/Product';
import { Deal } from '../src/models/Deal';
import { Guide } from '../src/models/Guide';
import { Review } from '../src/models/Review';
import { Article } from '../src/models/Article';
import { Comparison } from '../src/models/Comparison';

async function seedData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB for data seed...');
  await mongoose.connect(uri);

  console.log('\n--- 1. Migrating Categories ---');
  const categoryMap = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of mockCategories) {
    const updated = await Category.findOneAndUpdate(
      { slug: cat.slug },
      {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        itemCount: cat.itemCount,
        image: cat.image,
        featured: cat.featured ?? false,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryMap.set(cat.slug.toLowerCase(), updated._id as mongoose.Types.ObjectId);
    console.log(`  ✓ Category: ${cat.name} (${cat.slug})`);
  }

  console.log('\n--- 2. Migrating Products ---');
  const productMap = new Map<string, mongoose.Types.ObjectId>();
  for (const prod of mockProducts) {
    let catId = categoryMap.get(prod.categorySlug.toLowerCase());
    if (!catId) {
      // Find or create category on demand
      const c = await Category.findOne({ slug: prod.categorySlug.toLowerCase() });
      if (c) {
        catId = c._id as mongoose.Types.ObjectId;
        categoryMap.set(prod.categorySlug.toLowerCase(), catId);
      }
    }

    if (!catId) {
      console.warn(`  ⚠ Warning: Missing category for ${prod.name} (${prod.categorySlug})`);
      continue;
    }

    const updated = await Product.findOneAndUpdate(
      { slug: prod.slug },
      {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        image: prod.image,
        images: prod.images || [prod.image],
        category: catId,
        categorySlug: prod.categorySlug.toLowerCase(),
        price: prod.price,
        originalPrice: prod.originalPrice,
        discountPercent: prod.discountPercent,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        pros: prod.pros || [],
        cons: prod.cons || [],
        specifications: prod.specifications || {},
        marketplaces: prod.marketplaces || [],
        dealType: prod.dealType,
        isFeatured: prod.featured ?? false,
        isTrending: prod.trending ?? false,
        badgeText: prod.badgeText || '',
        dealStatus: 'active',
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    productMap.set(prod.slug.toLowerCase(), updated._id as mongoose.Types.ObjectId);
    console.log(`  ✓ Product: ${prod.name} (₹${prod.price})`);
  }

  console.log('\n--- 3. Migrating Deals ---');
  for (const deal of mockDeals) {
    const prodId = productMap.get(deal.slug.toLowerCase()) || productMap.get(deal.product?.slug?.toLowerCase() || '');
    const dealPrice = deal.product?.price || 0;
    const dealOriginalPrice = deal.product?.originalPrice || 0;

    await Deal.findOneAndUpdate(
      { slug: deal.slug },
      {
        title: deal.title,
        slug: deal.slug,
        description: deal.product?.description || '',
        product: prodId,
        productSlug: deal.slug,
        image: deal.product?.image || '',
        currentPrice: dealPrice,
        originalPrice: dealOriginalPrice,
        discountPercent: deal.discountPercent,
        marketplace: deal.marketplace,
        marketplaceUrl: '#',
        dealType: deal.dealType,
        endsIn: deal.endsIn || '12h 00m',
        verified: deal.verified ?? true,
        isFeatured: true,
        status: 'active',
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Deal: ${deal.title}`);
  }

  console.log('\n--- 4. Migrating Guides ---');
  for (const guide of mockGuides) {
    await Guide.findOneAndUpdate(
      { slug: guide.slug },
      {
        title: guide.title,
        slug: guide.slug,
        excerpt: guide.excerpt,
        content: guide.content,
        category: guide.category,
        categorySlug: guide.categorySlug.toLowerCase(),
        author: guide.author,
        readTime: guide.readTime,
        publishedAt: new Date(),
        image: guide.image,
        topPicks: guide.topPicks || [],
        comparisonTable: guide.comparisonTable || { headers: [], rows: [] },
        pros: guide.pros || [],
        cons: guide.cons || [],
        buyingTips: guide.buyingTips || [],
        relatedProductSlugs: guide.relatedProductSlugs || [],
        isPublished: true,
        seoTitle: `${guide.title} | OnlineSaleLive`,
        seoDescription: guide.excerpt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Guide: ${guide.title}`);
  }

  console.log('\n--- 5. Migrating Reviews ---');
  for (const rev of mockReviews) {
    const prodId = productMap.get(rev.productSlug.toLowerCase());
    await Review.findOneAndUpdate(
      { slug: rev.slug },
      {
        title: rev.title,
        slug: rev.slug,
        excerpt: rev.verdict,
        content: `Comprehensive hands-on evaluation of ${rev.productName}.`,
        product: prodId,
        productSlug: rev.productSlug,
        productName: rev.productName,
        image: rev.image,
        rating: rev.rating,
        verdict: rev.verdict,
        pros: rev.pros || [],
        cons: rev.cons || [],
        specifications: rev.specifications || {},
        price: rev.price,
        originalPrice: rev.originalPrice,
        discountPercent: rev.discountPercent,
        marketplaces: rev.marketplaces || [],
        author: rev.author || 'Review Desk',
        publishedAt: new Date(),
        isPublished: true,
        seoTitle: `${rev.title} | OnlineSaleLive`,
        seoDescription: rev.verdict,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Review: ${rev.title}`);
  }

  console.log('\n--- 6. Migrating Blog Articles ---');
  for (const post of mockBlogPosts) {
    await Article.findOneAndUpdate(
      { slug: post.slug },
      {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        image: post.image,
        category: post.category,
        author: post.author,
        readTime: post.readTime,
        publishedAt: new Date(),
        isPublished: true,
        seoTitle: `${post.title} | OnlineSaleLive Blog`,
        seoDescription: post.excerpt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Article: ${post.title}`);
  }

  console.log('\n--- 7. Seeding Initial Comparisons ---');
  const sampleProducts = Array.from(productMap.values()).slice(0, 2);
  const sampleSlugs = Array.from(productMap.keys()).slice(0, 2);
  if (sampleProducts.length >= 2) {
    await Comparison.findOneAndUpdate(
      { slug: 'earbuds-vs-headphones-comparison' },
      {
        title: 'TWS Earbuds vs Wired Earphones Comparison',
        slug: 'earbuds-vs-headphones-comparison',
        description: 'Comprehensive specifications, audio fidelity, and latency comparison.',
        products: sampleProducts,
        productSlugs: sampleSlugs,
        content: 'Detailed head-to-head performance matrix comparing battery life, noise cancellation, and Indian store prices.',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        isPublished: true,
        seoTitle: 'TWS Earbuds vs Wired Earphones Comparison | OnlineSaleLive',
        seoDescription: 'Side-by-side specs and price comparisons between popular personal audio gear in India.',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('  ✓ Comparison: Earbuds vs Headphones seeded');
  }

  console.log('\n✔ All mock data successfully migrated to MongoDB.');
  await mongoose.disconnect();
  process.exit(0);
}

seedData().catch((err) => {
  console.error('Data Seed Failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
