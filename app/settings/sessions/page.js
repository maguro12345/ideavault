 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/Navbar'

export default function SessionsPage() {
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await getSessions(user.id)
    await recordSession(user.id)
    setLoading(false)
  }

  async function getSessions(userId) {
    const { data } = await supabase.from('user_sessions')
      .select('*').eq('user_id', userId)
      .order('last_active_at', { ascending: false })
    setSessions(data || [])
  }

  async function recordSession(userId) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const deviceInfo = navigator.userAgent
    const token = session.access_token.slice(-20)
    const { data: existing } = await supabase.from('user_sessions')
      .select('id').eq('user_id', userId).eq('session_token', token).single()
    if (existing) {
      await supabase.from('user_sessions').update({ last_active_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('user_sessions').insert({ user_id: userId, session_token: token, device_info: deviceInfo, last_active_at: new Date().toISOString() })
    }
    await getSessions(userId)
  }

  async function forceLogout(sessionId) {
    if (!confirm('このセッションをログアウトしますか？')) return
    await supabase.from('user_sessions').delete().eq('id', sessionId)
    await getSessions(user.id)
  }

  async function forceLogoutAll() {
    if (!confirm('すべての端末からログアウトしますか？現在の端末もログアウトされます。')) return
    await supabase.from('user_sessions').delete().eq('user_id', user.id)
    await supabase.auth.signOut()
    router.push('/login')
  }

  function getDeviceIcon(ua) {
    if (!ua) return '💻'
    if (/iPhone|iPad|Android/.test(ua)) return '📱'
    if (/Mac/.test(ua)) return '🍎'
    if (/Windows/.test(ua)) return '🖥️'
    return '💻'
  }

  function getDeviceName(ua) {
    if (!ua) return '不明なデバイス'
    if (/iPhone/.test(ua)) return 'iPhone'
    if (/iPad/.test(ua)) return 'iPad'
    if (/Android/.test(ua)) return 'Android'
    if (/Mac/.test(ua)) return 'Mac'
    if (/Windows/.test(ua)) return 'Windows PC'
    return 'その他のデバイス'
  }

  function getBrowser(ua) {
    if (!ua) return ''
    if (/Chrome/.test(ua)) return 'Chrome'
    if (/Safari/.test(ua)) return 'Safari'
    if (/Firefox/.test(ua)) return 'Firefox'
    if (/Edge/.test(ua)) return 'Edge'
    return 'ブラウザ'
  }

  function formatDate(ts) {
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'たった今'
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '4px' }}>セッション管理</h1>
            <div style={{ fontSize: '13px', color: '#6b6b67' }}>現在ログイン中の端末一覧</div>
          </div>
          <button onClick={forceLogoutAll} style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#c04020', color: '#fff', border: 'none', cursor: 'pointer' }}>
            🚪 すべてログアウト
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '3rem', textAlign: 'center', color: '#a0a09c' }}>
              セッション情報がありません
            </div>
          ) : sessions.map((s, i) => (
            <div key={s.id} style={{ background: '#fff', borderRadius: '14px', border: `0.5px solid ${i === 0 ? '#1D9E75' : 'rgba(0,0,0,0.1)'}`, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '28px', flexShrink: 0 }}>{getDeviceIcon(s.device_info)}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>
                        {getDeviceName(s.device_info)} / {getBrowser(s.device_info)}
                      </div>
                      {i === 0 && <span style={{ fontSize: '10px', background: '#E1F5EE', color: '#0d6e50', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>現在のセッション</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b6b67', marginBottom: '3px' }}>
                      最終アクティブ：{formatDate(s.last_active_at)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a0a09c' }}>
                      ログイン：{formatDate(s.created_at)}
                    </div>
                  </div>
                </div>
                {i !== 0 && (
                  <button onClick={() => forceLogout(s.id)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: 'none', color: '#c04020', border: '1px solid #c04020', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ログアウト
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', background: '#f0eeea', borderRadius: '12px', padding: '14px 16px', fontSize: '12px', color: '#6b6b67', lineHeight: '1.7' }}>
          ⚠️ 身に覚えのないセッションがある場合は、すぐにパスワードを変更してください。
        </div>
      </div>
    </div>
  )
}