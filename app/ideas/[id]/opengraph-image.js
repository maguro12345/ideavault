import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'IdeaVault'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ideas?id=eq.${params.id}&select=title,concept,category,status,profiles(full_name,company_name,is_company)`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      }
    )
    const data = await res.json()
    const idea = data?.[0]

    const title = idea?.title || 'IdeaVault'
    const concept = idea?.concept?.slice(0, 100) || ''
    const name = idea?.profiles?.is_company ? idea.profiles.company_name : idea?.profiles?.full_name || ''
    const category = idea?.category?.split(', ')[0] || ''
    const status = idea?.status || 'アイデア'

    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: '#f5f4f0', display: 'flex', flexDirection: 'column', padding: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a18' }}>
              IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
            </div>
            {category && <div style={{ fontSize: '14px', background: '#E1F5EE', color: '#0d6e50', padding: '4px 14px', borderRadius: '20px', fontWeight: '600' }}>{category}</div>}
            <div style={{ fontSize: '14px', background: '#deeefb', color: '#1255a0', padding: '4px 14px', borderRadius: '20px', fontWeight: '600' }}>{status}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '52px', fontWeight: '700', color: '#1a1a18', lineHeight: 1.2, marginBottom: '24px' }}>{title}</div>
            {concept && <div style={{ fontSize: '22px', color: '#6b6b67', lineHeight: 1.6 }}>{concept}{(idea?.concept?.length || 0) > 100 ? '...' : ''}</div>}
          </div>
          {name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '32px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#fff' }}>{name[0]}</div>
              <div style={{ fontSize: '18px', color: '#6b6b67' }}>{name}</div>
            </div>
          )}
        </div>
      ),
      { ...size }
    )
  } catch {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', background: '#1a1a18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '700', color: '#fff' }}>
        IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
      </div>,
      { ...size }
    )
  }
}