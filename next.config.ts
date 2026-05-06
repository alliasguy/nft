import type { NextConfig } from "next";

const securityHeaders = [
  /* Prevent the site from being embedded in an iframe (clickjacking) */
  { key: "X-Frame-Options",        value: "DENY" },
  /* Stop browsers sniffing MIME types */
  { key: "X-Content-Type-Options", value: "nosniff" },
  /* Only send the origin in the Referer header */
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  /* Disable unnecessary browser features */
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  /* Force HTTPS for 1 year (production only) */
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
  /*
   * Content-Security-Policy
   * - default-src 'self'         : blocks unexpected resource origins
   * - script-src 'self' 'unsafe-inline' 'unsafe-eval' : Next.js requires these
   * - style-src  'self' 'unsafe-inline' fonts.googleapis.com
   * - img-src    'self' data: blob: *.supabase.co  : NFT images from storage
   * - connect-src *.supabase.co *.supabase.io      : API + realtime
   */
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.smartsuppchat.com https://www.smartsupp.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.smartsupp.com",
      "font-src 'self' https://fonts.gstatic.com https://www.smartsupp.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://picsum.photos https://fastly.picsum.photos https://api.dicebear.com https://*.smartsupp.com",
      "media-src 'self' blob: https://*.supabase.co https://*.supabase.in",
      "connect-src 'self' https://*.supabase.co https://*.supabase.io wss://*.supabase.co https://*.smartsupp.com wss://*.smartsupp.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        /* Apply security headers to every route */
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
