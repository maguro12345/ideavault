'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function CompanyNavbar() {
  const [profile, setProfile] = useState(null)
  const [unreadBiz, setUnreadBiz] = useState(0)
  const [unreadDM, setUnreadDM] = useState(0)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
    await getBizUnread(user.id)
    await getDMUnread(user.id)
  }

  async function getBizUnread(userId) {
    const { data: scouts } = await supabase
      .from('scouts').select('id').eq('from_company_id', userId).eq('status', 'accepted')
    if (!scouts || scouts.length === 0) return
    const { count } = await supabase.from('business_messages')
      .select('*', { count: 'exact', head: true })
      .in('scout_id', scouts.map(s => s.id))
      .eq('is_read', false).neq('sender_id', userId)
    setUnreadBiz(count || 0)
  }

  async function getDMUnread(userId) {
    const { count } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('is_read', false).eq('type', 'message')
    setUnreadDM(count || 0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NAV = [
    { href: '/company/dashboard', label: 'ダッシュボード', icon: '📊' },
    { href: '/company/ideas', label: 'アイデアを探す', icon: '💡' },
    { href: '/company/scouts', label: 'スカウト管理', icon: '📨' },
    { href: '/company/recruit', label: '募集を作成', icon: '📢' },
    { href: '/watchlist', label: 'ウォッチリスト', icon: '👁' },
  ]

  const name = profile?.company_name || profile?.full_name || '企業'

  return (
    <nav style={{
      background: '#1a3a5c', color: '#fff',
      padding: '0 1.5rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: '56px',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link href="/company/dashboard" style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          IDEA<span style={{ color: '#5DCAA5' }}>VAULT</span>
          <span style={{ fontSize: '10px', background: '#5DCAA5', color: '#1a3a5c', padding: '2px 7px', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>法人</span>
        </Link>
        <div style={{ display: 'flex', gap: '2px', flexWrap: 'nowrap' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
              textDecoration: 'none', transition: 'background 0.15s', whiteSpace: 'nowrap',
              background: pathname?.startsWith(n.href) ? 'rgba(255,255,255,0.15)' : 'none',
              color: pathname?.startsWith(n.href) ? '#fff' : 'rgba(255,255,255,0.7)'
            }}>
              <span style={{ fontSize: '14px' }}>{n.icon}</span>{n.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        

        <div style={{ position: 'relative' }}>
          <Link href="/messages" style={{ fontSize: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }} title="メッセージ">💬</Link>
          {unreadDM > 0 && (
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', background: '#e74c3c', color: '#fff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadDM > 9 ? '9+' : unreadDM}</div>
          )}
        </div>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '20px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#5DCAA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🏢</div>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>{name}</span>
          {profile?.is_verified && <span style={{ fontSize: '10px', background: '#d8f2ea', color: '#0d6e50', padding: '1px 6px', borderRadius: '20px', fontWeight: '700' }}>✅</span>}
        </div>

        <Link href="/company/verify" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '5px 8px', borderRadius: '6px', background: pathname === '/company/verify' ? 'rgba(255,255,255,0.15)' : 'none' }}>認証</Link>
        <Link href="/company/plan" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '5px 8px', borderRadius: '6px', background: pathname === '/company/plan' ? 'rgba(255,255,255,0.15)' : 'none' }}>プラン</Link>
        <Link href="/company/profile" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '5px 8px', borderRadius: '6px', background: pathname === '/company/profile' ? 'rgba(255,255,255,0.15)' : 'none' }}>設定</Link>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>ログアウト</button>
      </div>
    </nav>
  )
}