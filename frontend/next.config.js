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
              "connect-src 'self' https:",
              "object-src 'none'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/files/:file*.pdf',
        headers: [{ key: 'Content-Disposition', value: 'attachment' }],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },

  // The API now lives in this same Next.js app (pages/api/[...path].js), so the
  // frontend calls it on the same origin. Forced to '' so an old Vercel variable
  // pointing to the former Railway backend can't break the site.
  env: {
    NEXT_PUBLIC_BACKEND_URL: '',
  },

  // Files the API reads at runtime must be bundled with the serverless function
  experimental: {
    outputFileTracingIncludes: {
      '/api/[...path]': ['./server/db/*.sql'],
    },
  },

  // Old URLs from the Railway era
  async redirects() {
    return [
      { source: '/health', destination: '/api/health', permanent: false },
    ];
  },
};

module.exports = nextConfig;
