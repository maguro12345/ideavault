'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Home() {
  const [ideas, setIdeas] = useState([])
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('new')
  const [jobPostings, setJobPostings] = useState([])
  const [advisors, setAdvisors] = useState([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_company').eq('id', user.id).single()
      if (profile?.is_company) { window.location.href = '/company/dashboard'; return }
    }
    await Promise.all([getIdeas(), fetchCategories(), fetchJobPostings(), fetchAdvisors()])
  }

  async function getIdeas() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('ideas').select('*, profiles(id, username, full_name, is_company, company_name, avatar_url, is_private, is_verified), likes(count)').order('created_at', { ascending: false })
    if (data) {
      let filtered = data
      if (user) {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
        const followingIds = new Set(follows?.map(f => f.following_id) || [])
        filtered = data.filter(idea => {
          if (idea.is_draft) return false
          if (idea.is_hidden && idea.user_id !== user.id) return false
          if (!idea.profiles?.is_private) return true
          if (idea.user_id === user.id) return true
          return followingIds.has(idea.user_id)
        })
      } else {
        filtered = data.filter(idea => !idea.profiles?.is_private && !idea.is_hidden && !idea.is_draft)
      }
      setIdeas(filtered.map(i => ({ ...i, like_count: i.likes?.[0]?.count || 0 })))
    }
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('name').order('sort_order')
    setCategories(data?.map(c => c.name) || [])
  }

  async function fetchJobPostings() {
    const { data } = await supabase.from('job_postings')
      .select('*, profiles(id, company_name, full_name, avatar_url, is_verified, company_type)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(3)
    setJobPostings(data || [])
  }

  async function fetchAdvisors() {
    const { data } = await supabase.from('profiles')
      .select('id, company_name, full_name, advisor_role, advisor_specialty, avatar_url, company_description, is_verified')
      .eq('is_company', true)
      .eq('company_type', 'アドバイザー')
      .order('created_at', { ascending: false })
      .limit(5)
    setAdvisors(data || [])
  }

  const filtered = ideas.filter(i => {
    const q = search.toLowerCase()
    if (q && !i.title?.toLowerCase().includes(q) && !i.concept?.toLowerCase().includes(q) && !i.category?.toLowerCase().includes(q)) return false
    if (filterStatus && i.status !== filterStatus) return false
    if (filterCategory && i.category !== filterCategory) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'new') return new Date(b.created_at) - new Date(a.created_at)
    if (sort === 'popular') return (b.like_count || 0) - (a.like_count || 0)
    return 0
  })

  const BADGE = {
    'アイデア':  { bg: '#deeefb', color: '#1255a0' },
    '検討中':    { bg: '#fdecd4', color: '#8a4f0a' },
    '進行中':    { bg: '#d8f2ea', color: '#0d6e50' },
    '完成':      { bg: '#e4f2d8', color: '#376b10' },
    '一時停止':  { bg: '#eeecea', color: '#5a5a56' },
  }

  function IdeaCard({ idea }) {
    const badge = BADGE[idea.status] || BADGE['アイデア']
    const profile = idea.profiles
    const name = profile?.is_company ? profile.company_name : profile?.full_name || profile?.username || '名無し'
    return (
      <div onClick={() => router.push(`/ideas/${idea.id}`)}
        style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '14px', padding: '1.15rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', lineHeight: '1.4' }}>{idea.title}</div>
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, background: badge.bg, color: badge.color }}>{idea.status}</span>
        </div>
        {idea.concept && (
          <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.65', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {!user ? idea.concept.slice(0, 80) + '...' : idea.concept}
          </div>
        )}
        {user && idea.revenue && (
          <div style={{ background: '#f0eeea', borderRadius: '8px', padding: '9px 11px' }}>
            <div style={{ fontSize: '10px', color: '#a0a09c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '3px' }}>収益モデル</div>
            <div style={{ fontSize: '12px', color: '#1a1a18', lineHeight: '1.55', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{idea.revenue.split('\n')[0]}</div>
          </div>
        )}
        {!user && (
          <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b6b67' }}>収益モデル・詳細は</div>
            <Link href="/login" onClick={e => e.stopPropagation()} style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '700', textDecoration: 'none' }}>会員登録後に閲覧できます →</Link>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <div onClick={e => { e.stopPropagation(); router.push(`/profile/${profile?.id}`) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
            </div>
            <span style={{ fontSize: '11px', color: '#6b6b67' }}>{name}</span>
            {profile?.is_verified && <span style={{ fontSize: '10px' }} title="認証済み法人">✅</span>}
          </div>
          {idea.category && <span style={{ fontSize: '11px', background: '#f0eeea', padding: '2px 8px', borderRadius: '20px', color: '#6b6b67' }}>{idea.category.split(', ')[0]}</span>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* ヒーロー */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '16px', padding: '2.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>起業家のためのプラットフォーム</div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.5px', lineHeight: '1.3', color: '#1a1a18' }}>アイデアを、<br />事業に変える場所</h1>
            <p style={{ color: '#6b6b67', fontSize: '14px', marginBottom: '1.5rem', lineHeight: '1.8' }}>ビジネスアイデアを投稿して、共同創業者・投資家・企業と出会おう。</p>
            {!user ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link href="/login" style={{ background: '#1D9E75', color: '#fff', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>無料でアカウント作成</Link>
                <a href="#feed" style={{ background: 'none', color: '#1a1a18', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', border: '0.5px solid rgba(0,0,0,0.15)' }}>アイデアを見る</a>
              </div>
            ) : (
              <Link href="/ideas/create" style={{ background: '#1D9E75', color: '#fff', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>＋ 新しいアイデアを投稿する</Link>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[{ num: ideas.length, label: '投稿企画数' }, { num: categories.length, label: 'カテゴリ数' }, { num: ideas.filter(i => i.status === '進行中').length, label: '進行中の企画' }].map(({ num, label }) => (
              <div key={label} style={{ background: '#f5f4f0', borderRadius: '12px', padding: '1rem 1.25rem', textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1D9E75' }}>{num}</div>
                <div style={{ fontSize: '11px', color: '#6b6b67', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 未ログイン時：2分岐 */}
        {!user && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.75rem' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎓</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' }}>学生・起業家の方へ</div>
              <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.8', marginBottom: '16px' }}>アイデアを投稿して可能性を広げよう。タイムスタンプで先願性を証明できます。</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {['アイデアを投稿・公開', '企業・投資家からスカウトを受ける', '公開範囲を自分で設定', 'タイムスタンプで権利を保護'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1a1a18' }}>
                    <span style={{ color: '#1D9E75', fontWeight: '700', flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', background: '#1D9E75', color: '#fff', padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>無料で始める</Link>
            </div>
            <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid rgba(26,58,92,0.2)', padding: '1.75rem' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏢</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' }}>企業・投資家の方へ</div>
              <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.8', marginBottom: '16px' }}>次の事業の種を探そう。アイデア段階から起業家と接触できる唯一のプラットフォームです。</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {['アイデアを検索・閲覧', 'スカウトを送って直接接触', 'ビジネスチャットで商談', '月5件まで無料でスカウト'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1a1a18' }}>
                    <span style={{ color: '#1a3a5c', fontWeight: '700', flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/register-company" style={{ display: 'block', textAlign: 'center', background: '#1a3a5c', color: '#fff', padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>法人登録はこちら</Link>
            </div>
          </div>
        )}

        {/* メインコンテンツ：アドバイザー左・フィード右 */}
        <div style={{ display: 'grid', gridTemplateColumns: advisors.length > 0 ? '200px 1fr' : '1fr', gap: '16px', alignItems: 'start' }} id="feed">

          {/* アドバイザーリンク（左） */}
          {advisors.length > 0 && (
            <div style={{ position: 'sticky', top: '72px' }}>
              <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1rem', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎓</span> アドバイザー
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {advisors.map(a => {
                    const name = a.full_name || a.company_name || '名無し'
                    return (
                      <div key={a.id} onClick={() => router.push(`/profile/${a.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#fdecd4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#8a4f0a', overflow: 'hidden', flexShrink: 0 }}>
                          {a.avatar_url ? <img src={a.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                          <div style={{ fontSize: '10px', color: '#a0a09c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.advisor_role || '専門家'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 右側：募集 + フィード */}
          <div>
            {/* 企業からの募集 */}
            {jobPostings.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>📢 企業からの募集</span>
                  <Link href="/search?tab=recruit" style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '600', textDecoration: 'none' }}>もっと見る →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {jobPostings.map(p => {
                    const cName = p.profiles?.company_name || p.profiles?.full_name || '企業'
                    return (
                      <Link key={p.id} href={`/recruit/${p.id}`} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid rgba(26,58,92,0.2)', padding: '1rem 1.25rem', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, overflow: 'hidden' }}>
                          {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '2px' }}>{p.title}</div>
                          <div style={{ fontSize: '12px', color: '#6b6b67', marginBottom: '6px' }}>{cName}{p.profiles?.is_verified ? ' ✅' : ''}</div>
                          {p.description && <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '6px' }}>{p.description}</div>}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {p.industry && <span style={{ fontSize: '10px', background: '#eef2f7', color: '#1a3a5c', padding: '2px 7px', borderRadius: '20px' }}>{p.industry}</span>}
                            {p.budget && <span style={{ fontSize: '10px', background: '#d8f2ea', color: '#0d6e50', padding: '2px 7px', borderRadius: '20px' }}>💰 {p.budget}</span>}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* フィード */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>すべての企画</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ key: 'new', label: '新着' }, { key: 'popular', label: '人気' }].map(s => (
                  <button key={s.key} onClick={() => setSort(s.key)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer', background: sort === s.key ? '#1a1a18' : '#fff', color: sort === s.key ? '#fff' : '#6b6b67' }}>{s.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍　キーワードで検索..."
                style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', background: '#fff' }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', background: '#fff' }}>
                <option value="">すべてのステータス</option>
                {['アイデア','検討中','進行中','完成','一時停止'].map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', background: '#fff' }}>
                <option value="">すべてのカテゴリ</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#6b6b67' }}>読み込み中...</div>
            ) : sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#6b6b67' }}>
                <div style={{ fontSize: '40px', marginBottom: '1rem' }}>💡</div>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>まだアイデアがありません</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '14px', alignItems: 'start' }}>
                {sorted.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 未ログイン時フッター */}
      {!user && (
        <div style={{ background: '#fff', borderTop: '0.5px solid rgba(0,0,0,0.08)', marginTop: '3rem', padding: '3rem 1.25rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' }}>IdeaVaultの仕組み</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '3rem' }}>
              {[
                { step: '01', title: '投稿', desc: 'アイデアを投稿。タイムスタンプで先願性を自動記録。', icon: '✍️' },
                { step: '02', title: 'マッチング', desc: '企業・投資家がアイデアを検索してスカウト。', icon: '🔍' },
                { step: '03', title: 'コンタクト', desc: 'スカウトを承諾すると専用チャットが開始。', icon: '💬' },
                { step: '04', title: '事業化', desc: '合意に至ったら事業がスタート。', icon: '🚀' },
              ].map(({ step, title, desc, icon }) => (
                <div key={step} style={{ background: '#f5f4f0', borderRadius: '14px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#1D9E75', background: '#E1F5EE', padding: '2px 8px', borderRadius: '20px' }}>STEP {step}</div>
                    <span style={{ fontSize: '18px' }}>{icon}</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '6px' }}>{title}</div>
                  <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.7' }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', padding: '2rem', background: '#1a1a18', borderRadius: '16px', marginBottom: '2rem' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>あなたのアイデアを世界に</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>今すぐ無料で登録して、最初の一歩を踏み出しましょう</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" style={{ background: '#1D9E75', color: '#fff', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>個人で登録</Link>
                <Link href="/register-company" style={{ background: '#fff', color: '#1a1a18', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>法人で登録</Link>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
              <Link href="/terms" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>利用規約</Link>
              <Link href="/privacy" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>プライバシーポリシー</Link>
              <Link href="/stories" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>成功事例</Link>
              <Link href="/legal" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>特定商取引法に基づく表記</Link>
            </div>
            <div style={{ fontSize: '11px', color: '#a0a09c', textAlign: 'center' }}>© 2025 IdeaVault. All rights reserved.</div>
          </div>
        </div>
      )}
      {user && <Footer />}
    </div>
  )
}