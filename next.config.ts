import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    contentDispositionType: "inline",
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none';",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Timing-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/category/fashion',
        destination: '/category/clothing',
        permanent: true,
      },
      {
        source: '/category/home',
        destination: '/category/home-kitchen',
        permanent: true,
      },
      {
        source: '/category/footwear',
        destination: '/category/shoes',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
