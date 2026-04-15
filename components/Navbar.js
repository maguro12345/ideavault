'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      await getUnreadCount(user.id)
      subscribeToNotifications(user.id)
    }
  }

  async function getUnreadCount(userId) {
    const { count } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('is_read', false)
    setUnreadCount(count || 0)
  }

  function subscribeToNotifications(userId) {
    supabase.channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, () => { getUnreadCount(userId) })
      .subscribe()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <nav style={{
      background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)',
      padding: '0 1rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: '56px',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      {/* ロゴ */}
      <Link href="/" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
        IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
      </Link>

      {/* PC用ナビ */}
      {user ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* PCのみ表示 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/ideas/create" style={{
              background: '#1D9E75', color: '#fff', padding: '7px 14px',
              borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}>＋ 投稿</Link>

            <Link href="/scouts" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>📨</Link>
            <Link href="/search" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>🔍</Link>

            <div style={{ position: 'relative' }}>
              <Link href="/notifications" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>🔔</Link>
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#e74c3c', color: '#fff', fontSize: '10px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
                }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
              )}
            </div>

            <Link href="/messages" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>💬</Link>

            {/* メニュー */}
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              background: 'none', border: '0.5px solid rgba(0,0,0,0.15)',
              padding: '6px 10px', borderRadius: '8px',
              cursor: 'pointer', flexShrink: 0, fontSize: '13px',
              color: '#1a1a18', fontFamily: 'inherit', fontWeight: '600'
            }}>メニュー</button>
          </div>

          {/* ドロップダウンメニュー */}
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{
                position: 'absolute', top: '56px', right: '1rem',
                background: '#fff', borderRadius: '14px',
                border: '0.5px solid rgba(0,0,0,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                minWidth: '180px', zIndex: 100, overflow: 'hidden'
              }}>
                {[
                  { href: '/mypage', label: '👤 マイページ' },
                  { href: '/settings', label: '⚙️ 設定' },
                  { href: '/scouts', label: '📨 スカウト' },
                  { href: '/search', label: '🔍 検索' },
                  { href: '/notifications', label: '🔔 通知' },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
                    display: 'block', padding: '12px 16px', fontSize: '14px',
                    color: '#1a1a18', textDecoration: 'none', borderBottom: '0.5px solid rgba(0,0,0,0.06)'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >{item.label}</Link>
                ))}
                <button onClick={handleLogout} style={{
                  width: '100%', padding: '12px 16px', fontSize: '14px',
                  color: '#c04020', textAlign: 'left', background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fdeae4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >🚪 ログアウト</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/login" style={{
            background: '#1D9E75', color: '#fff', padding: '7px 16px',
            borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none'
          }}>ログイン</Link>
        </div>
      )}
    </nav>
  )
}