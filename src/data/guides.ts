import { Guide } from '@/types';

export const guides: Guide[] = [
  {
    id: 'guide-1',
    title: 'Best Earbuds Under ₹1000 in India (2026 Edition)',
    slug: 'best-earbuds-under-1000',
    excerpt: 'Looking for true wireless earbuds under ₹1000 with punchy bass, long battery life, and Active Noise Cancellation? Here are our top laboratory-tested picks.',
    content: `
      Finding reliable True Wireless Stereo (TWS) earbuds under ₹1,000 used to mean compromising heavily on audio clarity and microphone performance. Today, intense competition between brands like boAt, Noise, Boult, and pTron has democratized features like 32dB Active Noise Cancellation, ENC quad-microphones, and low latency game modes at three-digit prices.

      ### What to Look For Before Buying:
      1. **Driver Size**: A 10mm to 13mm dynamic driver ensures punchy bass response suitable for Bollywood and EDM genres.
      2. **Battery Life**: Look for at least 25 to 40 hours of combined playtime with fast charging (10 mins charge = 60 mins playback).
      3. **Mic Quality**: ENC (Environmental Noise Cancellation) mics ensure the listener hears your voice clearly even on busy roads.
    `,
    category: 'Electronics',
    categorySlug: 'electronics',
    readTime: '6 min read',
    updatedAt: 'October 2026',
    author: 'Audio Discovery Desk',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    topPicks: [
      {
        title: 'boAt Airdopes 141 ANC',
        subtitle: 'Best Overall with 32dB ANC',
        price: 999,
        productSlug: 'boat-airdopes-141-anc-earbuds',
        whyBuy: 'Unmatched 32dB ANC at sub-1000 price point and massive 42-hour combined battery endurance.',
      },
      {
        title: 'boAt BassHeads 100',
        subtitle: 'Best Budget Wired Alternative',
        price: 349,
        productSlug: 'boat-bassheads-100-wired-earphones',
        whyBuy: 'Zero latency, never runs out of charge, and surprisingly punchy bass for under ₹350.',
      },
    ],
    comparisonTable: {
      headers: ['Model', 'ANC', 'Battery Life', 'Driver Size', 'Best Price'],
      rows: [
        ['boAt Airdopes 141 ANC', 'Yes (32dB)', '42 Hours', '10mm', '₹999'],
        ['Boult Audio W20', 'ENC Only', '35 Hours', '13mm', '₹899'],
        ['Noise Buds VS102', 'ENC Only', '50 Hours', '11mm', '₹999'],
        ['pTron Bassbuds Duo', 'No', '32 Hours', '13mm', '₹699'],
      ],
    },
    pros: [
      'ANC is now available under ₹1000',
      'Type-C fast charging is universal',
      'IPX4 / IPX5 splash resistance included on most models',
    ],
    cons: [
      'Touch controls can be overly sensitive',
      'Ear tip sizes need adjustment for the best passive seal',
    ],
    buyingTips: [
      'Always test multiple silicon tips included in the box for optimal bass isolation.',
      'Turn off ANC mode when not in noisy environments to extend battery life by 25%.',
      'Compare prices across Flipkart and Amazon during festive sales to capture extra ₹100 coupon discounts.',
    ],
    relatedProductSlugs: [
      'boat-airdopes-141-anc-earbuds',
      'boat-bassheads-100-wired-earphones',
      'oneplus-nord-buds-2r-earbuds',
    ],
  },
  {
    id: 'guide-2',
    title: 'Best Running & Walking Shoes Under ₹1000',
    slug: 'best-shoes-under-1000',
    excerpt: 'Top durable, lightweight walking and gym sneakers under ₹1000 offering cushioned EVA soles, breathable mesh uppers, and solid grip.',
    content: `
      Whether you are starting a morning jogging routine or need dependable daily commuters for college or work, good shoes protect your joints from impact stress. At the sub-₹1,000 threshold, Indian brands like Sparx, Campus, and Asian deliver exceptional value.

      ### Key Checklist:
      - **EVA Sole**: Ethylene-vinyl acetate provides high shock absorption without weighing the foot down.
      - **Breathable Air Mesh**: Keeps feet cool and prevents sweat accumulation during Indian summers.
    `,
    category: 'Shoes',
    categorySlug: 'shoes',
    readTime: '5 min read',
    updatedAt: 'October 2026',
    author: 'Fitness Gear Team',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    topPicks: [
      {
        title: 'Sparx SM-734 Mesh Runners',
        subtitle: 'Most Durable Daily Runner',
        price: 849,
        productSlug: 'sparx-men-running-shoes-sm734',
        whyBuy: 'Long-lasting rubber traction outsole and breathable upper made for rugged Indian pavements.',
      },
    ],
    comparisonTable: {
      headers: ['Model', 'Sole Material', 'Weight', 'Ideal Usage', 'Price'],
      rows: [
        ['Sparx SM-734', 'EVA + Rubber', '240g', 'Running / Walking', '₹849'],
        ['Campus Oxyfit', 'Phylon', '260g', 'Casual / Walking', '₹899'],
        ['Asian Tarzan-11', 'Air Cushion EVA', '250g', 'Gym / Jogging', '₹749'],
      ],
    },
    pros: [
      'Very lightweight compared to heavy rubber sneakers',
      'Machine-washable mesh fabrics',
      'Incredible value for money',
    ],
    cons: [
      'Insoles should be replaced after 6 months of intense running',
    ],
    buyingTips: [
      'Order one size up if you have broader feet or plan to wear thick athletic socks.',
      'Check Myntra and AJIO end-of-season sales for extra 15% coupons.',
    ],
    relatedProductSlugs: [
      'sparx-men-running-shoes-sm734',
      'red-tape-men-memory-foam-walking-shoes',
      'puma-men-rebound-layup-sneakers',
    ],
  },
  {
    id: 'guide-3',
    title: 'Best Jeans Under ₹500 & ₹1000: Men & Women Buyer Guide',
    slug: 'best-jeans-under-500-and-1000',
    excerpt: 'How to discover comfortable stretch denim with modern washes and durable rivets under ₹1000 without sacrificing fabric quality.',
    content: `
      Denim is a timeless wardrobe staple. Finding high-quality denim with elastane stretch under ₹1000 is easier than ever on marketplaces like Myntra, Flipkart, and AJIO thanks to brands like Highlander, Roadster, and Tokyo Talkies.
    `,
    category: 'Fashion',
    categorySlug: 'fashion',
    readTime: '4 min read',
    updatedAt: 'October 2026',
    author: 'Style Desk',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    topPicks: [
      {
        title: 'Highlander Men Slim Fit Washed Jeans',
        subtitle: 'Best Stretch Denim',
        price: 699,
        productSlug: 'highlander-men-slim-fit-jeans',
        whyBuy: '2% elastane blend ensures sitting and commuting is effortlessly comfortable.',
      },
    ],
    comparisonTable: {
      headers: ['Brand', 'Fit', 'Fabric Blend', 'Price'],
      rows: [
        ['Highlander', 'Slim Fit', '98% Cotton, 2% Elastane', '₹699'],
        ['Roadster', 'Skinny Fit', '99% Cotton, 1% Spandex', '₹799'],
        ['Dennis Lingo', 'Straight Fit', '100% Rigid Denim', '₹899'],
      ],
    },
    pros: ['Great everyday stretch', 'Fade-resistant indigo dyes', 'Affordable to own multiple washes'],
    cons: ['Wash separately on first wash to prevent dye bleed'],
    buyingTips: [
      'Mid-rise fits provide the most universal comfort for sitting long hours at work or college.',
    ],
    relatedProductSlugs: [
      'highlander-men-slim-fit-jeans',
      'roadster-men-cotton-tshirt',
    ],
  },
  {
    id: 'guide-4',
    title: 'Best Laptops Under ₹50,000 for Students & Work (2026)',
    slug: 'best-laptops-under-50000',
    excerpt: 'Comprehensive comparison of Core i5, Ryzen 5, 16GB RAM laptops with SSD storage, backlit keyboards, and battery longevity under ₹50,000.',
    content: `
      ₹50,000 is the sweet spot in India for laptops. At this price point, you should strictly avoid older dual-core processors and settle for nothing less than a 10-core 12th/13th Gen Intel Core i5 or 6-core AMD Ryzen 5 processor paired with 16GB RAM and NVMe SSD storage.
    `,
    category: 'Laptops',
    categorySlug: 'laptops',
    readTime: '7 min read',
    updatedAt: 'October 2026',
    author: 'Tech Reviews Team',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    topPicks: [
      {
        title: 'ASUS Vivobook 15 Core i5 12th Gen',
        subtitle: 'Best Multitasking All-Rounder',
        price: 46990,
        productSlug: 'asus-vivobook-15-intel-i5',
        whyBuy: '16GB RAM out of the box, fast NVMe SSD, and 180-degree lay-flat hinge with antibacterial coating.',
      },
    ],
    comparisonTable: {
      headers: ['Model', 'CPU', 'RAM/SSD', 'Screen', 'Price'],
      rows: [
        ['ASUS Vivobook 15', 'Intel Core i5-1235U', '16GB / 512GB', '15.6" FHD Anti-glare', '₹46,990'],
        ['Lenovo IdeaPad Slim 3', 'Ryzen 5 7520U', '16GB / 512GB', '15.6" FHD IPS', '₹44,990'],
        ['HP 15s', 'Intel Core i5-1235U', '8GB / 512GB', '15.6" FHD Micro-edge', '₹48,990'],
        ['Acer Aspire Lite', 'Ryzen 5 5500U', '16GB / 512GB', '15.6" FHD', '₹38,990'],
      ],
    },
    pros: [
      'NVMe SSDs boot Windows in under 8 seconds',
      '16GB RAM handles 30+ browser tabs without stutter',
      'Type-C ports support easy phone tethering and display output',
    ],
    cons: [
      'Not equipped for heavy 4K gaming (needs dedicated GPU)',
    ],
    buyingTips: [
      'Prioritize 16GB RAM over slight CPU clock speed bumps for daily multitasking.',
      'Check HDFC/ICICI bank credit card offers on Amazon/Flipkart for instant ₹3000 to ₹4000 savings.',
    ],
    relatedProductSlugs: [
      'asus-vivobook-15-intel-i5',
      'ambrane-65w-braided-type-c-cable',
    ],
  },
];
