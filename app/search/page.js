 'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function SearchContent() {
  const [user, setUser] = useState(null)
  const [query, setQuery] = useState('')
  const [userResults, setUserResults] = useState([])
  const [ideaResults, setIdeaResults] = useState([])
  const [tab, setTab] = useState('users')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    init()
  }, [])

  useEffect(() => {
    if (query.trim().length < 1) { setUserResults([]); setIdeaResults([]); return }
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  async function search(q) {
    setLoading(true)
    const [{ data: users }, { data: ideas }] = await Promise.all([
      supabase.from('profiles')
        .select('id, username, full_name, bio, avatar_url, is_company, company_name, tags')
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%,bio.ilike.%${q}%,company_name.ilike.%${q}%`)
        .limit(20),
      supabase.from('ideas')
        .select('id, title, concept, category, status, profiles(id, full_name, username)')
        .or(`title.ilike.%${q}%,concept.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(20)
    ])
    setUserResults(users || [])
    setIdeaResults(ideas || [])
    setLoading(false)
  }

  const BADGE = {
    'アイデア':  { bg: '#deeefb', color: '#1255a0' },
    '検討中':    { bg: '#fdecd4', color: '#8a4f0a' },
    '進行中':    { bg: '#d8f2ea', color: '#0d6e50' },
    '完成':      { bg: '#e4f2d8', color: '#376b10' },
    '一時停止':  { bg: '#eeecea', color: '#5a5a56' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{
        background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)',
        padding: '0 1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 10
      }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: 'inherit' }}>
          IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
        </Link>
        <Link href="/" style={{ fontSize: '13px', color: '#6b6b67', textDecoration: 'none' }}>← フィードに戻る</Link>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>検索</h1>

        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="ユーザー名・アイデアを検索..."
          autoFocus
          style={{
            width: '100%', padding: '12px 16px', borderRadius: '12px',
            border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '15px',
            outline: 'none', boxSizing: 'border-box', marginBottom: '1rem',
            background: '#fff'
          }}
        />

        {query.trim() && (
          <>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
              {[{ key: 'users', label: `ユーザー ${userResults.length}` }, { key: 'ideas', label: `企画 ${ideaResults.length}` }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                  border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer',
                  background: tab === t.key ? '#1a1a18' : '#fff',
                  color: tab === t.key ? '#fff' : '#6b6b67'
                }}>{t.label}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b6b67' }}>検索中...</div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>

                {tab === 'users' && (
                  userResults.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>ユーザーが見つかりませんでした</div>
                  ) : userResults.map(p => {
                    const name = p.is_company ? p.company_name : p.full_name || p.username || '名無し'
                    return (
                      <div key={p.id} onClick={() => router.push(`/profile/${p.id}`)} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                        cursor: 'pointer'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                          background: '#E1F5EE', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '18px', fontWeight: '600',
                          color: '#0F6E56', overflow: 'hidden'
                        }}>
                          {p.avatar_url ? <img src={p.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>{name}</div>
                          {p.username && <div style={{ fontSize: '12px', color: '#a0a09c' }}>@{p.username}</div>}
                          {p.bio && <div style={{ fontSize: '12px', color: '#6b6b67', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.bio}</div>}
                        </div>
                        {(p.tags || []).length > 0 && (
                          <span style={{ fontSize: '11px', background: '#E1F5EE', color: '#0d6e50', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>{p.tags[0]}</span>
                        )}
                      </div>
                    )
                  })
                )}

                {tab === 'ideas' && (
                  ideaResults.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>企画が見つかりませんでした</div>
                  ) : ideaResults.map(idea => {
                    const badge = BADGE[idea.status] || BADGE['アイデア']
                    const profile = idea.profiles
                    const name = profile?.full_name || profile?.username || '名無し'
                    return (
                      <div key={idea.id} onClick={() => router.push(`/ideas/${idea.id}`)} style={{
                        padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', cursor: 'pointer'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>{idea.title}</div>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, background: badge.bg, color: badge.color }}>{idea.status}</span>
                        </div>
                        {idea.concept && <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '6px' }}>{idea.concept}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#a0a09c' }}>{name}</span>
                          {idea.category && <span style={{ fontSize: '11px', background: '#f0eeea', padding: '2px 6px', borderRadius: '10px', color: '#6b6b67' }}>{idea.category}</span>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}

        {!query.trim() && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#a0a09c' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '14px' }}>ユーザーやアイデアを検索してみましょう</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}><div style={{ color: '#6b6b67' }}>読み込み中...</div></div>}>
      <SearchContent />
    </Suspense>
  )
}
