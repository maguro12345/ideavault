'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

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
    if (query.trim().length < 1) {
      setUserResults([])
      setIdeaResults([])
      return
    }
    const timer = setTimeout(() => search(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  async function search(q) {
    setLoading(true)

    // @がついていたら除去してusername検索
    const cleanQ = q.startsWith('@') ? q.slice(1) : q

    const [{ data: users }, { data: ideas }] = await Promise.all([
      supabase.from('profiles')
        .select('id, username, full_name, bio, avatar_url, is_company, company_name, tags, location')
        .or([
          `username.ilike.%${cleanQ}%`,
          `full_name.ilike.%${cleanQ}%`,
          `bio.ilike.%${cleanQ}%`,
          `company_name.ilike.%${cleanQ}%`
        ].join(','))
        .limit(20),
      supabase.from('ideas')
        .select('id, title, concept, category, status, profiles(id, full_name, username, is_company, company_name)')
        .or([
          `title.ilike.%${q}%`,
          `concept.ilike.%${q}%`,
          `category.ilike.%${q}%`,
          `features.ilike.%${q}%`,
          `target.ilike.%${q}%`,
          `revenue.ilike.%${q}%`
        ].join(','))
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

  function highlight(text, q) {
    if (!text || !q) return text
    const clean = q.startsWith('@') ? q.slice(1) : q
    const idx = text.toLowerCase().indexOf(clean.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: '#E1F5EE', color: '#0d6e50', borderRadius: '3px', padding: '0 2px' }}>
          {text.slice(idx, idx + clean.length)}
        </span>
        {text.slice(idx + clean.length)}
      </>
    )
  }

  const totalResults = userResults.length + ideaResults.length

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>検索</h1>

        {/* 検索ボックス */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ユーザー名・@username・企画名で検索..."
            autoFocus
            style={{
              width: '100%', padding: '12px 16px 12px 42px',
              borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.15)',
              fontSize: '15px', outline: 'none', boxSizing: 'border-box',
              background: '#fff'
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer',
              color: '#a0a09c', lineHeight: 1
            }}>✕</button>
          )}
        </div>

        {/* ヒント */}
        {!query && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {['@ユーザー名', 'AIアプリ', 'フードテック', 'SaaS', '進行中'].map(hint => (
              <button key={hint} onClick={() => setQuery(hint)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px',
                border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff',
                color: '#6b6b67', cursor: 'pointer'
              }}>{hint}</button>
            ))}
          </div>
        )}

        {query.trim() && (
          <>
            {/* タブ */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
              {[
                { key: 'users', label: `ユーザー`, count: userResults.length },
                { key: 'ideas', label: `企画`, count: ideaResults.length }
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: '7px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                  border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer',
                  background: tab === t.key ? '#1a1a18' : '#fff',
                  color: tab === t.key ? '#fff' : '#6b6b67'
                }}>
                  {t.label}
                  <span style={{
                    marginLeft: '6px', fontSize: '11px',
                    background: tab === t.key ? 'rgba(255,255,255,0.25)' : '#f0eeea',
                    color: tab === t.key ? '#fff' : '#6b6b67',
                    padding: '1px 7px', borderRadius: '20px'
                  }}>{t.count}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b6b67' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                検索中...
              </div>
            ) : totalResults === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#a0a09c' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>😔</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' }}>「{query}」の検索結果はありません</div>
                <div style={{ fontSize: '13px' }}>別のキーワードで試してみてください</div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>

                {/* ユーザー一覧 */}
                {tab === 'users' && (
                  userResults.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>ユーザーが見つかりませんでした</div>
                  ) : userResults.map(p => {
                    const name = p.is_company ? p.company_name : p.full_name || p.username || '名無し'
                    return (
                      <div key={p.id} onClick={() => router.push(`/profile/${p.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <div style={{ width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, background: p.is_company ? '#1a3a5c' : '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600', color: p.is_company ? '#fff' : '#0F6E56', overflow: 'hidden' }}>
                          {p.avatar_url ? <img src={p.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.is_company ? '🏢' : name[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>{highlight(name, query)}</div>
                            {p.is_company && <span style={{ fontSize: '10px', background: '#1a3a5c', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>法人</span>}
                          </div>
                          {p.username && (
                            <div style={{ fontSize: '12px', color: '#a0a09c', marginBottom: '2px' }}>
                              @{highlight(p.username, query)}
                            </div>
                          )}
                          {p.bio && (
                            <div style={{ fontSize: '12px', color: '#6b6b67', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {highlight(p.bio, query)}
                            </div>
                          )}
                          {(p.tags || []).length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {p.tags.slice(0, 3).map(tag => (
                                <span key={tag} style={{ fontSize: '10px', background: '#E1F5EE', color: '#0d6e50', padding: '1px 7px', borderRadius: '20px' }}>{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {p.location && (
                          <div style={{ fontSize: '11px', color: '#a0a09c', flexShrink: 0 }}>📍 {p.location}</div>
                        )}
                      </div>
                    )
                  })
                )}

                {/* 企画一覧 */}
                {tab === 'ideas' && (
                  ideaResults.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>企画が見つかりませんでした</div>
                  ) : ideaResults.map(idea => {
                    const badge = BADGE[idea.status] || BADGE['アイデア']
                    const profile = idea.profiles
                    const pName = profile?.is_company ? profile.company_name : profile?.full_name || profile?.username || '名無し'
                    return (
                      <div key={idea.id} onClick={() => router.push(`/ideas/${idea.id}`)}
                        style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', lineHeight: '1.4' }}>
                            {highlight(idea.title, query)}
                          </div>
                          <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, background: badge.bg, color: badge.color }}>{idea.status}</span>
                        </div>
                        {idea.concept && (
                          <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '8px' }}>
                            {highlight(idea.concept, query)}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600', color: '#0F6E56', flexShrink: 0 }}>{pName[0]}</div>
                          <span style={{ fontSize: '11px', color: '#a0a09c' }}>{pName}</span>
                          {idea.category && (
                            <span style={{ fontSize: '11px', background: '#f0eeea', padding: '2px 8px', borderRadius: '20px', color: '#6b6b67' }}>
                              {highlight(idea.category, query)}
                            </span>
                          )}
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
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' }}>ユーザーや企画を探す</div>
            <div style={{ fontSize: '13px' }}>@から始めるとユーザー名で検索できます</div>
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
