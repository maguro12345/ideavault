'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdvisorNavbar() {
  const [profile, setProfile] = useState(null)
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
    const { count } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('is_read', false).eq('type', 'message')
    setUnreadDM(count || 0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NAV = [
    { href: '/advisor/dashboard', label: 'ダッシュボード', icon: '📊' },
    { href: '/advisor/consultations', label: '相談管理', icon: '💬' },
    { href: '/advisor/articles', label: 'コンテンツ投稿', icon: '✍️' },
    { href: '/cofounder', label: '起業家を探す', icon: '🤝' },
  ]

  const name = profile?.full_name || profile?.company_name || 'アドバイザー'

  return (
    <nav style={{ background: '#2d1f5e', color: '#fff', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link href="/advisor/dashboard" style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          IDEA<span style={{ color: '#9F8FEF' }}>VAULT</span>
          <span style={{ fontSize: '10px', background: '#9F8FEF', color: '#2d1f5e', padding: '2px 7px', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>ADV</span>
        </Link>
        <div style={{ display: 'flex', gap: '2px', flexWrap: 'nowrap' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
              textDecoration: 'none', whiteSpace: 'nowrap',
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
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#9F8FEF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#2d1f5e', overflow: 'hidden' }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
          </div>
          <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>{name}</span>
          {profile?.is_verified && <span style={{ fontSize: '10px', background: '#d8f2ea', color: '#0d6e50', padding: '1px 6px', borderRadius: '20px', fontWeight: '700' }}>✅</span>}
        </div>

        <Link href="/company/profile" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '5px 8px', borderRadius: '6px' }}>設定</Link>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>ログアウト</button>
      </div>
    </nav>
  )
}