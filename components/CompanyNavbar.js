 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function CompanyNavbar() {
  const [profile, setProfile] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
    await getUnreadCount(user.id)
    subscribeToNotifications(user.id)
  }

  async function getUnreadCount(userId) {
    const { data: scouts } = await supabase
      .from('scouts').select('id').eq('from_company_id', userId).eq('status', 'accepted')
    if (!scouts || scouts.length === 0) return
    const { count } = await supabase.from('business_messages')
      .select('*', { count: 'exact', head: true })
      .in('scout_id', scouts.map(s => s.id))
      .eq('is_read', false)
      .neq('sender_id', userId)
    setUnreadCount(count || 0)
  }

  function subscribeToNotifications(userId) {
    supabase.channel('biz_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'business_messages' }, () => {
        getUnreadCount(userId)
      })
      .subscribe()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NAV = [
    { href: '/company/dashboard', label: 'ダッシュボード', icon: '📊' },
    { href: '/company/ideas', label: 'アイデアを探す', icon: '💡' },
    { href: '/company/scouts', label: 'スカウト管理', icon: '📨' },
  ]

  const name = profile?.company_name || profile?.full_name || '企業'

  return (
    <nav style={{
      background: '#1a3a5c', color: '#fff',
      padding: '0 1.5rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: '56px',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link href="/company/dashboard" style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: '#fff' }}>
          IDEA<span style={{ color: '#5DCAA5' }}>VAULT</span>
          <span style={{ fontSize: '10px', background: '#5DCAA5', color: '#1a3a5c', padding: '2px 7px', borderRadius: '4px', marginLeft: '8px', fontWeight: '700', letterSpacing: '0.5px' }}>法人</span>
        </Link>
        <div style={{ display: 'flex', gap: '4px' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
              textDecoration: 'none', transition: 'background 0.15s',
              background: pathname === n.href ? 'rgba(255,255,255,0.15)' : 'none',
              color: pathname === n.href ? '#fff' : 'rgba(255,255,255,0.7)'
            }}>
              <span style={{ fontSize: '14px' }}>{n.icon}</span>{n.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <Link href="/company/scouts" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>💬</Link>
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#e74c3c', color: '#fff', fontSize: '10px', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{unreadCount > 9 ? '9+' : unreadCount}</div>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '20px'
        }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#5DCAA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#1a3a5c' }}>🏢</div>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>{name}</span>
        </div>
        <Link href="/company/profile" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>設定</Link>
        <button onClick={handleLogout} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)',
          padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
        }}>ログアウト</button>
      </div>
    </nav>
  )
}
