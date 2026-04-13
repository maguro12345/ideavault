 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
      .select('*, profiles!from_id(id, username, full_name, avatar_url), ideas(id, title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
  }

  async function markAllRead(userId) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
  }

  function getNotifText(n) {
    const name = n.profiles?.full_name || n.profiles?.username || '名無し'
    if (n.type === 'like') return { icon: '❤️', text: `${name}さんがあなたの「${n.ideas?.title || '企画'}」にいいねしました` }
    if (n.type === 'follow') return { icon: '👤', text: `${name}さんがあなたをフォローしました` }
    if (n.type === 'follow_request') return { icon: '🔔', text: `${name}さんからフォローリクエストが届きました` }
    if (n.type === 'message') return { icon: '💬', text: `${name}さんからメッセージが届きました` }
    return { icon: '📢', text: '新しい通知があります' }
  }

  function getNotifLink(n) {
    if (n.type === 'like') return `/ideas/${n.idea_id}`
    if (n.type === 'follow' || n.type === 'follow_request') return `/profile/${n.from_id}`
    if (n.type === 'message') return `/messages`
    return '/'
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
            const senderName = n.profiles?.full_name || n.profiles?.username || '?'
            return (
              <div
                key={n.id}
                onClick={() => router.push(link)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer', background: n.is_read ? '#fff' : '#f0faf6',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                onMouseLeave={e => e.currentTarget.style.background = n.is_read ? '#fff' : '#f0faf6'}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#E1F5EE', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '16px', fontWeight: '600',
                    color: '#0F6E56', overflow: 'hidden'
                  }}>
                    {n.profiles?.avatar_url
                      ? <img src={n.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : senderName[0]
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
                  <div style={{ fontSize: '13px', color: '#1a1a18', lineHeight: '1.6' }}>{text}</div>
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
