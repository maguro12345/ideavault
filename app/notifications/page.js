'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

export default function NotificationsPage() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await getNotifications(user.id)
    await markAllRead(user.id)
    setLoading(false)
  }

  async function getNotifications(userId) {
    const { data } = await supabase
      .from('notifications')
      .select('*, profiles!from_id(id, username, full_name, avatar_url, is_company, company_name, is_verified), ideas(id, title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
  }

  async function markAllRead(userId) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
  }

  function getNotifText(n) {
    const p = n.profiles
    const name = p?.is_company ? p.company_name : p?.full_name || p?.username || '名無し'
    const ideaTitle = n.ideas?.title || '企画'
    switch (n.type) {
      case 'like':           return { icon: '❤️', text: `${name}さんが「${ideaTitle}」にいいねしました` }
      case 'watch':          return { icon: '👁', text: `${name}さんが「${ideaTitle}」をウォッチしました` }
      case 'follow':         return { icon: '👤', text: `${name}さんがあなたをフォローしました` }
      case 'follow_request': return { icon: '🔔', text: `${name}さんからフォローリクエストが届きました` }
      case 'message':        return { icon: '💬', text: `${name}さんからメッセージが届きました` }
      case 'scout':          return { icon: '📨', text: `${name}さんからスカウトが届きました！「${ideaTitle}」への提案です` }
      case 'scout_accepted': return { icon: '✅', text: `${name}さんがスカウトを承諾しました` }
      case 'scout_agreed':   return { icon: '🎉', text: `${name}さんとのビジネス合意が成立しました！おめでとうございます` }
      default:               return { icon: '📢', text: '新しい通知があります' }
    }
  }

  function getNotifLink(n) {
    switch (n.type) {
      case 'like':
      case 'watch':          return `/ideas/${n.idea_id}`
      case 'follow':
      case 'follow_request': return `/profile/${n.from_id}`
      case 'message':        return `/messages?to=${n.from_id}`
      case 'scout':          return `/scouts`
      case 'scout_accepted':
      case 'scout_agreed':   return `/company/scouts`
      default:               return '/'
    }
  }

  function getNotifColor(type) {
    switch (type) {
      case 'scout':        return '#fff8e6'
      case 'scout_agreed': return '#E1F5EE'
      case 'like':         return '#fff0f0'
      default:             return '#fff'
    }
  }

  function formatTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'たった今'
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
    return `${Math.floor(diff / 86400)}日前`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>通知</h1>

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#a0a09c' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔔</div>
              <div style={{ fontSize: '14px' }}>まだ通知はありません</div>
            </div>
          ) : notifications.map(n => {
            const { icon, text } = getNotifText(n)
            const link = getNotifLink(n)
            const p = n.profiles
            const senderName = p?.is_company ? p.company_name : p?.full_name || p?.username || '?'
            const isSpecial = n.type === 'scout' || n.type === 'scout_agreed'
            return (
              <div key={n.id} onClick={() => router.push(link)} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                cursor: 'pointer',
                background: !n.is_read ? (isSpecial ? getNotifColor(n.type) : '#f0faf6') : '#fff',
                transition: 'background 0.1s',
                borderLeft: isSpecial ? '3px solid #1D9E75' : '3px solid transparent'
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                onMouseLeave={e => e.currentTarget.style.background = !n.is_read ? (isSpecial ? getNotifColor(n.type) : '#f0faf6') : '#fff'}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: p?.is_company ? '#1a3a5c' : '#E1F5EE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: '600',
                    color: p?.is_company ? '#fff' : '#0F6E56', overflow: 'hidden'
                  }}>
                    {p?.avatar_url
                      ? <img src={p.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : p?.is_company ? '🏢' : senderName[0]
                    }
                  </div>
                  <div style={{
                    position: 'absolute', bottom: '-2px', right: '-2px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '11px', border: '1px solid #f0eeea'
                  }}>{icon}</div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    {p?.is_verified && (
                      <span style={{ fontSize: '10px', background: '#d8f2ea', color: '#0d6e50', padding: '1px 6px', borderRadius: '20px', fontWeight: '600' }}>✅ 認証済み</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#1a1a18', lineHeight: '1.6' }}>{text}</div>
                  {n.type === 'scout' && (
                    <div style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '600', marginTop: '4px' }}>→ スカウトを確認する</div>
                  )}
                  <div style={{ fontSize: '11px', color: '#a0a09c', marginTop: '3px' }}>{formatTime(n.created_at)}</div>
                </div>

                {!n.is_read && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1D9E75', flexShrink: 0, marginTop: '6px' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}