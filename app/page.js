'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [ideas, setIdeas] = useState([])
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    getUser()
    getIdeas()
  }, [])

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  async function getIdeas() {
    const { data } = await supabase
      .from('ideas')
      .select('*, profiles(username, full_name, is_company, company_name)')
      .order('created_at', { ascending: false })
    if (data) {
      setIdeas(data)
      const cats = [...new Set(data.map(i => i.category).filter(Boolean))]
      setCategories(cats)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  const filtered = ideas.filter(i => {
    const q = search.toLowerCase()
    if (q && !i.title?.toLowerCase().includes(q) &&
        !i.concept?.toLowerCase().includes(q) &&
        !i.category?.toLowerCase().includes(q)) return false
    if (filterStatus && i.status !== filterStatus) return false
    if (filterCategory && i.category !== filterCategory) return false
    return true
  })

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
        <div style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' }}>
          IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user ? (
            <>
              <Link href="/ideas/create" style={{
                background: '#1D9E75', color: '#fff', padding: '7px 16px',
                borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                textDecoration: 'none'
              }}>＋ 投稿する</Link>
              <Link href="/mypage" style={{ fontSize: '13px', color: '#6b6b67', textDecoration: 'none' }}>マイページ</Link>
              <button onClick={handleLogout} style={{
                background: 'none', border: '0.5px solid rgba(0,0,0,0.15)',
                padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
                color: '#6b6b67', cursor: 'pointer'
              }}>ログアウト</button>
            </>
          ) : (
            <Link href="/login" style={{
              background: '#1D9E75', color: '#fff', padding: '7px 16px',
              borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              textDecoration: 'none'
            }}>ログイン / 登録</Link>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        {!user && (
          <div style={{
            background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)',
            borderRadius: '16px', padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem'
          }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.5px' }}>
              アイデアを、事業に変える場所
            </h1>
            <p style={{ color: '#6b6b67', fontSize: '14px', marginBottom: '1.5rem', lineHeight: '1.7' }}>
              ビジネスアイデアを投稿して、共同創業者・企業と出会おう
            </p>
            <Link href="/login" style={{
              background: '#1D9E75', color: '#fff', padding: '10px 28px',
              borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none'
            }}>無料でアカウント作成</Link>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍　キーワードで検索..."
            style={{
              flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '10px',
              border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none',
              background: '#fff'
            }}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
            padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)',
            fontSize: '13px', background: '#fff', cursor: 'pointer'
          }}>
            <option value="">すべてのステータス</option>
            {['アイデア','検討中','進行中','完成','一時停止'].map(s =>
              <option key={s}>{s}</option>
            )}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{
            padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)',
            fontSize: '13px', background: '#fff', cursor: 'pointer'
          }}>
            <option value="">すべてのカテゴリ</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b6b67' }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b6b67' }}>
            <div style={{ fontSize: '40px', marginBottom: '1rem' }}>💡</div>
            <div style={{ fontWeight: '600', marginBottom: '6px' }}>まだアイデアがありません</div>
            <div style={{ fontSize: '13px' }}>最初の投稿者になりましょう</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {filtered.map(idea => {
              const badge = BADGE[idea.status] || BADGE['アイデア']
              const profile = idea.profiles
              const name = profile?.is_company ? profile.company_name : profile?.full_name || profile?.username || '名無し'
              return (
                <Link key={idea.id} href={`/ideas/${idea.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)',
                    borderRadius: '14px', padding: '1.15rem 1.3rem',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    cursor: 'pointer', transition: 'box-shadow 0.15s', height: '100%'
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', lineHeight: '1.4' }}>{idea.title}</div>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                        fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0,
                        background: badge.bg, color: badge.color
                      }}>{idea.status}</span>
                    </div>
                    {idea.concept && (
                      <div style={{
                        fontSize: '13px', color: '#6b6b67', lineHeight: '1.65',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>{idea.concept}</div>
                    )}
                    {idea.revenue && (
                      <div style={{ background: '#f0eeea', borderRadius: '8px', padding: '9px 11px' }}>
                        <div style={{ fontSize: '10px', color: '#a0a09c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '3px' }}>収益モデル</div>
                        <div style={{
                          fontSize: '12px', color: '#1a1a18', lineHeight: '1.55',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>{idea.revenue}</div>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: '#E1F5EE', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#0F6E56'
                        }}>{name[0]}</div>
                        <span style={{ fontSize: '11px', color: '#6b6b67' }}>{name}</span>
                        {idea.category && (
                          <span style={{
                            fontSize: '11px', background: '#f0eeea', padding: '2px 8px',
                            borderRadius: '20px', color: '#6b6b67'
                          }}>{idea.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}