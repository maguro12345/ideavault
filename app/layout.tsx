import type { Metadata } from "next";
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'IdeaVault | アイデアを事業に変えるプラットフォーム',
    template: '%s | IdeaVault'
  },
  description: 'ビジネスアイデアを投稿して、企業・投資家・共同創業者と出会おう。タイムスタンプで先願性を証明し、スカウトで事業化を実現するプラットフォーム。',
  keywords: ['ビジネスアイデア', '起業', 'スタートアップ', '投資家', 'スカウト', '共同創業者', 'ピッチ', '事業化'],
  authors: [{ name: 'IdeaVault' }],
  creator: 'IdeaVault',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://ideavault-silk.vercel.app',
    siteName: 'IdeaVault',
    title: 'IdeaVault | アイデアを事業に変えるプラットフォーム',
    description: 'ビジネスアイデアを投稿して、企業・投資家・共同創業者と出会おう。',
    images: [{ url: 'https://ideavault-silk.vercel.app/og-image.png', width: 1200, height: 630, alt: 'IdeaVault' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IdeaVault | アイデアを事業に変えるプラットフォーム',
    description: 'ビジネスアイデアを投稿して、企業・投資家・共同創業者と出会おう。',
    images: ['https://ideavault-silk.vercel.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'QuxsjlYB4bzPqlIEjNBSgReB61Rcg3o3j4ryUANe0Ug',
  },
  alternates: {
    canonical: 'https://ideavault-silk.vercel.app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
