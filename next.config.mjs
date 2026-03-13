/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.tradingview.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' *.supabase.co wss://*.supabase.co *.binance.com fapi.binance.com api.binance.com api1.binance.com api2.binance.com api3.binance.com *.cryptopanic.com https:",
      "frame-src 'self' *.tradingview.com",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "coin-images.coingecko.com" },
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "*.binance.com" },
      { protocol: "https", hostname: "fapi.binance.com" },
    ],
  },
  async headers() {
    return [
      // Security headers on all pages
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // CORS for public data API routes (no credentials involved)
      {
        source: "/api/(ticker|global|markets|fear-greed|news|klines|liquidations)(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;
