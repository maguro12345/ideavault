export async function generateMetadata({ params }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ideas?id=eq.${params.id}&select=title,concept,category`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      next: { revalidate: 3600 }
    }
  )
  const data = await res.json()
  const idea = data?.[0]

  const title = idea?.title ? `${idea.title} - IdeaVault` : 'IdeaVault'
  const description = idea?.concept?.slice(0, 150) || 'ビジネスアイデアのマッチングプラットフォーム'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'IdeaVault',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  }
}

export default function Layout({ children }) {
  return children
}