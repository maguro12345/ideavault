'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import CompanyNavbar from '../../components/CompanyNavbar'

export default function WatchlistPage() {
  const [user, setUser] = useState(null)
  const [isCompany, setIsCompany] = useState(false)
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: profile } = await supabase.from('profiles').select('is_company').eq('id', user.id).single()
    setIsCompany(profile?.is_company || false)
    const { data } = await supabase
      .from('watches')
      .select('*, ideas(*, profiles(id, full_name, username, company_name, is_company, avatar_url, is_verified))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setIdeas(data?.map(w => w.ideas).filter(Boolean) || [])
    setLoading(false)
  }

  async function unwatch(ideaId) {
    await supabase.from('watches').delete().eq('user_id', user.id).eq('idea_id', ideaId)
    setIdeas(prev => prev.filter(i => i.id !== ideaId))
  }

  const BADGE = {
    'アイデア':  { bg: '#deeefb', color: '#1255a0' },
    '検討中':    { bg: '#fdecd4', color: '#8a4f0a' },
    '進行中':    { bg: '#d8f2ea', color: '#0d6e50' },
    '完成':      { bg: '#e4f2d8', color: '#376b10' },
    '一時停止':  { bg: '#eeecea', color: '#5a5a56' },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      {isCompany ? <CompanyNavbar /> : <Navbar />}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.5px' }}>👁 ウォッチリスト</h1>
        <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.5rem' }}>更新があると通知が届きます</div>

        {ideas.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>👁</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' }}>ウォッチしているアイデアはありません</div>
            <div style={{ fontSize: '13px', color: '#6b6b67' }}>アイデアの詳細ページからウォッチできます</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ideas.map(idea => {
              const badge = BADGE[idea.status] || BADGE['アイデア']
              const profile = idea.profiles
              const name = profile?.is_company ? profile.company_name : profile?.full_name || profile?.username || '名無し'
              return (
                <div key={idea.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => router.push(`/ideas/${idea.id}`)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{idea.title}</div>
                        <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '20px', fontWeight: '600', background: badge.bg, color: badge.color }}>{idea.status}</span>
                      </div>
                      {idea.concept && (
                        <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '8px' }}>{idea.concept}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
                          {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
                        </div>
                        <span style={{ fontSize: '11px', color: '#6b6b67' }}>{name}</span>
                        {profile?.is_verified && <span style={{ fontSize: '10px' }}>✅</span>}
                        {idea.category && <span style={{ fontSize: '11px', background: '#f0eeea', padding: '2px 8px', borderRadius: '20px', color: '#6b6b67' }}>{idea.category.split(', ')[0]}</span>}
                      </div>
                    </div>
                    <button onClick={() => unwatch(idea.id)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(0,0,0,0.15)', background: '#fff', color: '#6b6b67', cursor: 'pointer', flexShrink: 0 }}>解除</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}