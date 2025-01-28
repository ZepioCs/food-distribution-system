import createMiddleware from 'next-intl/middleware';
import { i18n } from './i18n.config';

export default createMiddleware({
  // A list of all locales that are supported
  locales: i18n.locales,

  // Used when no locale matches
  defaultLocale: i18n.defaultLocale,

  // Redirect to default locale when accessing root path
  localePrefix: 'always'
});

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /images (inside /public)
  // - /favicon.ico, /sitemap.xml (static files)
  matcher: ['/', '/((?!api|_next|images|favicon.ico|sitemap.xml).*)']
}; 