/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: http: https: blob:",
              "connect-src 'self' http://localhost:5000 https:",
              "frame-src 'none'",
              "object-src 'none'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  images: {
    domains: ['localhost', 'avatars.githubusercontent.com', 'github.com', 'salehmahamatsaleh.com', 'api.salehmahamatsaleh.com'],
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost', port: '5000', pathname: '/**' },
      { protocol: 'https', hostname: 'api.salehmahamatsaleh.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.up.railway.app', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'design.canva.ai' },
    ],
  },

  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;
