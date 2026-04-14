'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import CompanyNavbar from '../../../components/CompanyNavbar'

export default function CompanyScoutsPage() {
  const [user, setUser] = useState(null)
  const [scouts, setScouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('is_company').eq('id', user.id).single()
    if (!profile?.is_company) { router.push('/'); return }
    setUser(user)
    await getScouts(user.id)
    setLoading(false)
  }

  async function getScouts(userId) {
    const { data } = await supabase.from('scouts')
      .select('*, profiles!to_user_id(id, full_name, username, avatar_url, bio, tags), ideas(id, title, concept, category)')
      .eq('from_company_id', userId)
      .order('created_at', { ascending: false })
    setScouts(data || [])
  }

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }

  const STATUS = {
    pending:  { label: '返答待ち', bg: '#fdecd4', color: '#8a4f0a' },
    accepted: { label: '承諾済み', bg: '#d8f2ea', color: '#0d6e50' },
    rejected: { label: '辞退済み', bg: '#eeecea', color: '#5a5a56' }
  }

  const filtered = tab === 'all' ? scouts : scouts.filter(s => s.status === tab)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      <CompanyNavbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18', marginBottom: '1.25rem' }}>スカウト管理</h1>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
          {[
            { key: 'all', label: `すべて ${scouts.length}` },
            { key: 'pending', label: `返答待ち ${scouts.filter(s => s.status === 'pending').length}` },
            { key: 'accepted', label: `承諾済み ${scouts.filter(s => s.status === 'accepted').length}` },
            { key: 'rejected', label: `辞退済み ${scouts.filter(s => s.status === 'rejected').length}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer',
              background: tab === t.key ? '#1a3a5c' : '#fff',
              color: tab === t.key ? '#fff' : '#6b6b67'
            }}>{t.label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.08)', padding: '4rem', textAlign: 'center', color: '#a0a09c' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontSize: '14px' }}>スカウトがありません</div>
          </div>
        ) : filtered.map(scout => {
          const status = STATUS[scout.status] || STATUS.pending
          const target = scout.profiles
          const tName = target?.full_name || target?.username || '名無し'
          return (
            <div key={scout.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.08)', padding: '1.25rem', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => router.push(`/profile/${target?.id}`)}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
                    {target?.avatar_url ? <img src={target.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : tName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{tName}</div>
                    {target?.bio && <div style={{ fontSize: '12px', color: '#6b6b67' }}>{target.bio}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', background: status.bg, color: status.color }}>{status.label}</span>
                  <span style={{ fontSize: '11px', color: '#a0a09c' }}>{formatDate(scout.created_at)}</span>
                </div>
              </div>

              <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#a0a09c', marginBottom: '3px' }}>対象企画</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{scout.ideas?.title}</div>
                {scout.ideas?.concept && <div style={{ fontSize: '12px', color: '#6b6b67', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{scout.ideas.concept}</div>}
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'inline-block', background: '#eef2f7', color: '#1a3a5c', fontSize: '11px', fontWeight: '700', padding: '2px 9px', borderRadius: '20px', marginBottom: '6px' }}>{scout.offer_type}</div>
                <div style={{ fontSize: '13px', color: '#1a1a18', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{scout.content}</div>
              </div>

              {scout.status === 'accepted' && (
                <button onClick={() => router.push(`/messages?to=${target?.id}`)} style={{
                  width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                  background: '#1a3a5c', color: '#fff', border: 'none', cursor: 'pointer'
                }}>💬 メッセージを開く</button>
              )}
              {scout.status === 'pending' && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#a0a09c', padding: '8px' }}>相手の返答を待っています...</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}