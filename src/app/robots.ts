import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/clients',
          '/projects',
          '/tasks',
          '/videos',
          '/invoices',
          '/settings',
          '/client/dashboard',
          '/client/projects',
          '/api',
        ],
      },
    ],
    sitemap: 'https://clientregit.com/sitemap.xml',
  }
}