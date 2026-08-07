/** @type {import('next').NextConfig} */

/* Security headers. Added during the pre-deployment audit — the app ships
 * candidate PII and CVs, so it should not be embeddable, should not leak
 * referrers to third parties, and should be HTTPS-only once it is on Vercel.
 *
 * No Content-Security-Policy is set here deliberately: a strict CSP needs to
 * be written against the real deployed asset origins and tested, and a
 * half-right CSP that gets ignored is worse than an honest absence. */
const securityHeaders = [
  /* This app is never meant to be framed — blocks clickjacking. */
  { key: 'X-Frame-Options', value: 'DENY' },
  /* Stops the browser second-guessing declared content types. */
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  /* Don't leak candidate-bearing URLs to other origins. */
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  /* Nothing here needs these devices. */
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  /* HTTPS only. Harmless on localhost (browsers ignore HSTS over http). */
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig = {
  /* Verification builds write somewhere else so they cannot overwrite the
   * .next directory a running `next dev` is serving from. Doing that leaves
   * the browser asking for chunks that no longer exist, which surfaces as
   * "Cannot read properties of undefined (reading 'call')" or a blank 500.
   * Use `npm run verify` rather than `npm run build` while dev is running. */
  distDir: process.env.NEXT_DIST_DIR || '.next',

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
