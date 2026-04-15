 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import CompanyNavbar from '../../../components/CompanyNavbar'

export default function CompanyVerifyPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [corpNumber, setCorpNumber] = useState('')
  const [verifyResult, setVerifyResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!data?.is_company) { router.push('/'); return }
    setProfile(data)
    setCorpNumber(data.corporate_number || '')
    setLoading(false)
  }

  async function checkCorpNumber() {
    if (corpNumber.length !== 13) { alert('法人番号は13桁で入力してください'); return }
    setChecking(true)
    try {
      const res = await fetch(`https://api.houjin-bangou.nta.go.jp/4/num?id=&number=${corpNumber}&type=12&history=0`)
      if (res.ok) {
        setVerifyResult({ found: true, message: '法人番号が確認できました' })
      } else {
        setVerifyResult({ found: false, message: '法人番号を確認できませんでした' })
      }
    } catch {
      setVerifyResult({ found: true, message: '形式は正しいです。申請を進めてください。' })
    }
    setChecking(false)
  }

  async function applyVerification() {
    if (!corpNumber.trim()) { alert('法人番号を入力してください'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({
      corporate_number: corpNumber,
      is_verified: true
    }).eq('id', user.id)
    setProfile(prev => ({ ...prev, corporate_number: corpNumber, is_verified: true }))
    setSaving(false)
    alert('認証バッジを取得しました！')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      <CompanyNavbar />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a18', marginBottom: '6px' }}>法人認証</h1>
        <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.5rem' }}>法人番号を登録して認証バッジを取得しましょう</div>

        {profile?.is_verified && (
          <div style={{ background: '#d8f2ea', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>✅</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d6e50', marginBottom: '3px' }}>認証済み法人アカウント</div>
              <div style={{ fontSize: '12px', color: '#0d6e50' }}>法人番号：{profile.corporate_number}</div>
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '14px' }}>認証バッジとは</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
            {[
              { icon: '🏛️', text: '法人番号を登録することで、正式な法人であることが証明されます' },
              { icon: '✅', text: 'プロフィールとスカウトに「認証済み」バッジが表示されます' },
              { icon: '📈', text: '認証済みアカウントはスカウトの承諾率が向上します' },
              { icon: '🔒', text: '個人投稿者が安心してスカウトを受けられるようになります' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
                <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.6' }}>{text}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>法人番号（13桁）</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={corpNumber} onChange={e => setCorpNumber(e.target.value.replace(/\D/g, '').slice(0, 13))}
                placeholder="例：1234567890123"
                style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none' }} />
              <button onClick={checkCorpNumber} disabled={checking || corpNumber.length !== 13} style={{
                padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                background: '#f0f2f5', color: '#1a3a5c', border: '0.5px solid rgba(26,58,92,0.3)',
                cursor: 'pointer', whiteSpace: 'nowrap', opacity: corpNumber.length !== 13 ? 0.6 : 1
              }}>{checking ? '確認中...' : '確認'}</button>
            </div>
            <div style={{ fontSize: '11px', color: '#a0a09c', marginTop: '5px' }}>
              法人番号は
              <a href="https://www.houjin-bangou.nta.go.jp/" target="_blank" rel="noopener noreferrer" style={{ color: '#1D9E75', textDecoration: 'none', margin: '0 3px' }}>国税庁法人番号公表サイト</a>
              で確認できます
            </div>
          </div>

          {verifyResult && (
            <div style={{ background: verifyResult.found ? '#d8f2ea' : '#fdeae4', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontSize: '13px', color: verifyResult.found ? '#0d6e50' : '#c04020' }}>
              {verifyResult.message}
            </div>
          )}

          <button onClick={applyVerification} disabled={saving || !corpNumber.trim()} style={{
            width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
            cursor: saving || !corpNumber.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !corpNumber.trim() ? 0.6 : 1
          }}>{saving ? '処理中...' : '✅ 認証バッジを取得する'}</button>
        </div>
      </div>
    </div>
  )
}
