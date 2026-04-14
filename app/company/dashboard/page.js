 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import CompanyNavbar from '../../../components/CompanyNavbar'

export default function CompanyDashboard() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ sent: 0, accepted: 0, pending: 0, rejected: 0 })
  const [recentScouts, setRecentScouts] = useState([])
  const [recentIdeas, setRecentIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile?.is_company) { router.push('/'); return }
    setProfile(profile)
    await getStats(user.id)
    await getRecentScouts(user.id)
    await getRecentIdeas()
    setLoading(false)
  }

  async function getStats(userId) {
    const { data } = await supabase.from('scouts').select('status').eq('from_company_id', userId)
    if (!data) return
    setStats({
      sent: data.length,
      accepted: data.filter(s => s.status === 'accepted').length,
      pending: data.filter(s => s.status === 'pending').length,
      rejected: data.filter(s => s.status === 'rejected').length
    })
  }

  async function getRecentScouts(userId) {
    const { data } = await supabase.from('scouts')
      .select('*, profiles!to_user_id(id, full_name, username, avatar_url), ideas(id, title)')
      .eq('from_company_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentScouts(data || [])
  }

  async function getRecentIdeas() {
    const { data } = await supabase.from('ideas')
      .select('*, profiles(id, full_name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(6)
    setRecentIdeas(data || [])
  }

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const STATUS = {
    pending:  { label: '返答待ち', bg: '#fdecd4', color: '#8a4f0a' },
    accepted: { label: '承諾済み', bg: '#d8f2ea', color: '#0d6e50' },
    rejected: { label: '辞退済み', bg: '#eeecea', color: '#5a5a56' }
  }

  const BADGE = {
    'アイデア':  { bg: '#deeefb', color: '#1255a0' },
    '検討中':    { bg: '#fdecd4', color: '#8a4f0a' },
    '進行中':    { bg: '#d8f2ea', color: '#0d6e50' },
    '完成':      { bg: '#e4f2d8', color: '#376b10' },
    '一時停止':  { bg: '#eeecea', color: '#5a5a56' },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      <CompanyNavbar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* ウェルカム */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a18', marginBottom: '4px' }}>
            おかえりなさい、{profile?.company_name || profile?.full_name}さん
          </h1>
          <div style={{ fontSize: '13px', color: '#6b6b67' }}>
            {profile?.industry && `${profile.industry} · `}{profile?.company_type}アカウント
          </div>
        </div>

        {/* 統計カード */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '1.5rem' }}>
          {[
            { label: '送信スカウト数', num: stats.sent, color: '#1a3a5c' },
            { label: '承諾済み', num: stats.accepted, color: '#0d6e50' },
            { label: '返答待ち', num: stats.pending, color: '#8a4f0a' },
            { label: '辞退済み', num: stats.rejected, color: '#5a5a56' },
          ].map(({ label, num, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.08)', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color, marginBottom: '4px' }}>{num}</div>
              <div style={{ fontSize: '12px', color: '#6b6b67' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* 最近のスカウト */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>最近のスカウト</div>
              <button onClick={() => router.push('/company/scouts')} style={{ fontSize: '12px', color: '#1a3a5c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>すべて見る →</button>
            </div>
            {recentScouts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>まだスカウトを送っていません</div>
            ) : recentScouts.map(s => {
              const status = STATUS[s.status] || STATUS.pending
              const tName = s.profiles?.full_name || s.profiles?.username || '名無し'
              return (
                <div key={s.id} onClick={() => s.status === 'accepted' && router.push(`/company/chat/${s.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.04)', cursor: s.status === 'accepted' ? 'pointer' : 'default' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#0F6E56', flexShrink: 0, overflow: 'hidden' }}>
                    {s.profiles?.avatar_url ? <img src={s.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : tName[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{tName}</div>
                    <div style={{ fontSize: '11px', color: '#a0a09c', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.ideas?.title}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '600', background: status.bg, color: status.color }}>{status.label}</span>
                    <span style={{ fontSize: '10px', color: '#a0a09c' }}>{formatDate(s.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 最新アイデア */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>最新のアイデア</div>
              <button onClick={() => router.push('/company/ideas')} style={{ fontSize: '12px', color: '#1a3a5c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>すべて見る →</button>
            </div>
            {recentIdeas.map(idea => {
              const badge = BADGE[idea.status] || BADGE['アイデア']
              const pName = idea.profiles?.full_name || idea.profiles?.username || '名無し'
              return (
                <div key={idea.id} onClick={() => router.push(`/company/ideas?idea=${idea.id}`)}
                  style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '3px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{idea.title}</div>
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, background: badge.bg, color: badge.color }}>{idea.status}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#a0a09c' }}>{pName} · {idea.category}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
