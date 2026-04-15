 import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/company/dashboard', '/company/scouts', '/company/ideas', '/messages', '/settings', '/mypage', '/onboarding'],
    },
    sitemap: 'https://ideavault-silk.vercel.app/sitemap.xml',
  }
}
