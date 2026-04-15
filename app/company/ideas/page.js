'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import CompanyNavbar from '../../../components/CompanyNavbar'

function CompanyIdeasContent() {
  const [user, setUser] = useState(null)
  const [ideas, setIdeas] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [scoutedIds, setScoutedIds] = useState([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('is_company').eq('id', user.id).single()
    if (!profile?.is_company) { router.push('/'); return }
    setUser(user)
    await getIdeas()
    await getCategories()
    await getScoutedIds(user.id)
    const ideaId = searchParams.get('idea')
    if (ideaId) {
      const { data } = await supabase.from('ideas').select('*, profiles(id, full_name, username, bio, avatar_url, tags)').eq('id', ideaId).single()
      setSelected(data)
    }
    setLoading(false)
  }

  async function getIdeas() {
    const { data } = await supabase.from('ideas')
        .select('*, profiles(id, full_name, username, bio, avatar_url, tags, location, is_verified)')
        .eq('is_hidden', false)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
    setIdeas(data || [])
  }

  async function getCategories() {
    const { data } = await supabase.from('categories').select('name').order('sort_order')
    setCategories(data?.map(c => c.name) || [])
  }

  async function getScoutedIds(userId) {
    const { data } = await supabase.from('scouts').select('idea_id').eq('from_company_id', userId)
    setScoutedIds(data?.map(s => s.idea_id) || [])
  }

  async function openIdea(idea) {
    const { data } = await supabase.from('ideas').select('*, profiles(id, full_name, username, bio, avatar_url, tags, location, is_verified)').eq('id', idea.id).single()
    setSelected(data)
  }

  const filtered = ideas.filter(i => {
    const q = search.toLowerCase()
    if (q && !i.title?.toLowerCase().includes(q) && !i.concept?.toLowerCase().includes(q)) return false
    if (filterStatus && i.status !== filterStatus) return false
    if (filterCategory && !(i.category || '').includes(filterCategory)) return false
    return true
  })

  const BADGE = {
    'アイデア':  { bg: '#deeefb', color: '#1255a0' },
    '検討中':    { bg: '#fdecd4', color: '#8a4f0a' },
    '進行中':    { bg: '#d8f2ea', color: '#0d6e50' },
    '完成':      { bg: '#e4f2d8', color: '#376b10' },
    '一時停止':  { bg: '#eeecea', color: '#5a5a56' },
  }

  const sec = (num, label, value) => value ? (
    <div style={{ padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#1a3a5c', color: '#fff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a1a18' }}>{label}</div>
      </div>
      <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.8', whiteSpace: 'pre-wrap', paddingLeft: '27px' }}>{value}</div>
    </div>
  ) : null

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      <CompanyNavbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '14px' }}>

          {/* 左：アイデア一覧 */}
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18', marginBottom: '1rem' }}>アイデアを探す</h1>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 キーワードで検索..."
                style={{ flex: 1, minWidth: '160px', padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', background: '#fff' }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', background: '#fff' }}>
                <option value="">すべてのステータス</option>
                {['アイデア','検討中','進行中','完成','一時停止'].map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', background: '#fff' }}>
                <option value="">すべてのカテゴリ</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(idea => {
                const badge = BADGE[idea.status] || BADGE['アイデア']
                const profile = idea.profiles
                const pName = profile?.full_name || profile?.username || '名無し'
                const isScouted = scoutedIds.includes(idea.id)
                const isSelected = selected?.id === idea.id
                return (
                  <div key={idea.id} onClick={() => openIdea(idea)}
                    style={{
                      background: '#fff', borderRadius: '12px',
                      border: `0.5px solid ${isSelected ? '#1a3a5c' : 'rgba(0,0,0,0.08)'}`,
                      padding: '14px 16px', cursor: 'pointer',
                      borderLeft: isSelected ? '3px solid #1a3a5c' : '3px solid transparent'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(26,58,92,0.3)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>{idea.title}</div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {isScouted && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: '#eef2f7', color: '#1a3a5c', fontWeight: '600' }}>送信済み</span>}
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '600', background: badge.bg, color: badge.color }}>{idea.status}</span>
                      </div>
                    </div>
                    {idea.concept && <div style={{ fontSize: '12px', color: '#6b6b67', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '6px' }}>{idea.concept}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
                        {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : pName[0]}
                      </div>
                      <span style={{ fontSize: '11px', color: '#a0a09c' }}>{pName}</span>
                      {idea.category && <span style={{ fontSize: '11px', background: '#f0eeea', padding: '1px 7px', borderRadius: '20px', color: '#6b6b67' }}>{idea.category.split(', ')[0]}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 右：詳細パネル */}
          {selected && (
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.08)', height: 'fit-content', position: 'sticky', top: '70px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a3a5c' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{selected.title}</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>

              {/* 投稿者情報 */}
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
                  {selected.profiles?.avatar_url ? <img src={selected.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (selected.profiles?.full_name || '?')[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18' }}>{selected.profiles?.full_name || selected.profiles?.username}</div>
                    {selected.profiles?.is_verified && <span style={{ fontSize: '10px', background: '#d8f2ea', color: '#0d6e50', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>✅ 認証済み</span>}
                  </div>
                  {selected.profiles?.bio && <div style={{ fontSize: '11px', color: '#6b6b67' }}>{selected.profiles.bio}</div>}
                </div>
              </div>

              {/* スカウトボタン */}
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                {scoutedIds.includes(selected.id) ? (
                  <div style={{ textAlign: 'center', padding: '10px', background: '#eef2f7', borderRadius: '10px', fontSize: '13px', color: '#1a3a5c', fontWeight: '600' }}>
                    ✓ スカウト送信済み
                  </div>
                ) : (
                  <button onClick={() => router.push(`/scout?idea=${selected.id}`)} style={{
                    width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff',
                    border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                  }}>🏢 スカウトを送る</button>
                )}
              </div>

              {/* 詳細内容 */}
              <div style={{ padding: '0 16px 16px', maxHeight: '60vh', overflowY: 'auto' }}>
                {sec(1, 'コンセプト', selected.concept)}
                {sec(2, '主な機能・サービス', selected.features)}
                {sec(3, 'ターゲット', selected.target)}
                {sec(4, '収益モデル', selected.revenue)}
                {sec(5, '差別化の本質', selected.edge)}
                {sec(6, '立ち上げ戦略', selected.launch)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CompanyIdeasPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}><div style={{ color: '#6b6b67' }}>読み込み中...</div></div>}>
      <CompanyIdeasContent />
    </Suspense>
  )
}
