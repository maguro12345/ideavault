'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) await getUnreadCount(user.id)
  }

  async function getUnreadCount(userId) {
    const { count } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('is_read', false)
    setUnreadCount(count || 0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav style={{
      background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)',
      padding: '0 1.5rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 10
    }}>
      <Link href="/" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: 'inherit' }}>
        IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
      </Link>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {user ? (
          <>
            <Link href="/ideas/create" style={{
              background: '#1D9E75', color: '#fff', padding: '7px 16px',
              borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none'
            }}>＋ 投稿する</Link>

            <Link href="/search" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>🔍</Link>

            <div style={{ position: 'relative' }}>
              <Link href="/notifications" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>🔔</Link>
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#e74c3c', color: '#fff',
                  fontSize: '10px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
              )}
            </div>

            <Link href="/messages" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>💬</Link>
            <Link href="/mypage" style={{ fontSize: '13px', color: '#6b6b67', textDecoration: 'none' }}>マイページ</Link>
            <Link href="/settings" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>⚙️</Link>
            <button onClick={handleLogout} style={{
              background: 'none', border: '0.5px solid rgba(0,0,0,0.15)',
              padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
              color: '#6b6b67', cursor: 'pointer', fontFamily: 'inherit'
            }}>ログアウト</button>
          </>
        ) : (
          <Link href="/login" style={{
            background: '#1D9E75', color: '#fff', padding: '7px 16px',
            borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none'
          }}>ログイン / 登録</Link>
        )}
      </div>
    </nav>
  )
} 
