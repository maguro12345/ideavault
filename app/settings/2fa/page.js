 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/Navbar'

export default function TwoFactorPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [factors, setFactors] = useState([])
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [factorId, setFactorId] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await getFactors()
    setLoading(false)
  }

  async function getFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (!error) setFactors(data?.totp || [])
  }

  async function startEnroll() {
    setEnrolling(true)
    setMessage('')
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'IdeaVault', friendlyName: 'IdeaVault 2FA' })
    if (error) { setMessage('エラー: ' + error.message); setEnrolling(false); return }
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setFactorId(data.id)
  }

  async function verifyEnroll() {
    if (!verifyCode.trim()) { setMessage('認証コードを入力してください'); return }
    setVerifying(true)
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError) { setMessage('エラー: ' + challengeError.message); setVerifying(false); return }

    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challengeData.id, code: verifyCode })
    if (error) { setMessage('認証コードが正しくありません'); setVerifying(false); return }

    setQrCode(null)
    setSecret(null)
    setFactorId(null)
    setVerifyCode('')
    setEnrolling(false)
    setMessage('✅ 2要素認証が有効になりました')
    await getFactors()
    setVerifying(false)
  }

  async function unenroll(id) {
    if (!confirm('2要素認証を無効にしますか？')) return
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id })
    if (error) { setMessage('エラー: ' + error.message); return }
    setMessage('2要素認証を無効にしました')
    await getFactors()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  const isEnabled = factors.some(f => f.status === 'verified')

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '6px' }}>2要素認証（2FA）</h1>
        <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.5rem' }}>アカウントのセキュリティを強化します</div>

        {message && (
          <div style={{ background: message.includes('✅') ? '#d8f2ea' : '#fdeae4', borderRadius: '12px', padding: '12px 16px', marginBottom: '1rem', fontSize: '13px', color: message.includes('✅') ? '#0d6e50' : '#c04020', fontWeight: '600' }}>
            {message}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '4px' }}>認証アプリ（TOTP）</div>
              <div style={{ fontSize: '12px', color: '#6b6b67' }}>Google Authenticator、Authyなど</div>
            </div>
            <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', background: isEnabled ? '#d8f2ea' : '#f0eeea', color: isEnabled ? '#0d6e50' : '#6b6b67' }}>
              {isEnabled ? '✅ 有効' : '無効'}
            </span>
          </div>

          {!isEnabled && !enrolling && (
            <>
              <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.8', marginBottom: '1rem' }}>
                2要素認証を有効にすると、ログイン時にパスワードに加えて認証アプリのコードが必要になります。
              </div>
              <button onClick={startEnroll} style={{ width: '100%', padding: '11px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                2要素認証を設定する
              </button>
            </>
          )}

          {enrolling && qrCode && (
            <div>
              <div style={{ fontSize: '13px', color: '#1a1a18', fontWeight: '600', marginBottom: '10px' }}>① 認証アプリでQRコードをスキャン</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <img src={qrCode} alt="QR Code" style={{ width: '180px', height: '180px', border: '4px solid #f5f4f0', borderRadius: '10px' }} />
              </div>
              <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6b6b67', marginBottom: '4px' }}>QRコードが読み取れない場合はこのコードを入力</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', letterSpacing: '2px', wordBreak: 'break-all' }}>{secret}</div>
              </div>
              <div style={{ fontSize: '13px', color: '#1a1a18', fontWeight: '600', marginBottom: '8px' }}>② 認証アプリに表示された6桁のコードを入力</div>
              <input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '20px', outline: 'none', textAlign: 'center', letterSpacing: '8px', boxSizing: 'border-box', marginBottom: '10px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEnrolling(false); setQrCode(null) }} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: '#fff', cursor: 'pointer' }}>キャンセル</button>
                <button onClick={verifyEnroll} disabled={verifying || verifyCode.length !== 6} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer', opacity: verifyCode.length !== 6 ? 0.5 : 1 }}>
                  {verifying ? '確認中...' : '確認して有効化'}
                </button>
              </div>
            </div>
          )}

          {isEnabled && factors.filter(f => f.status === 'verified').map(f => (
            <div key={f.id}>
              <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '12px', lineHeight: '1.7' }}>
                2要素認証が有効です。ログイン時に認証アプリのコードが必要です。
              </div>
              <button onClick={() => unenroll(f.id)} style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#fff', color: '#c04020', border: '1px solid #c04020', cursor: 'pointer' }}>
                2要素認証を無効にする
              </button>
            </div>
          ))}
        </div>

        <div style={{ background: '#fdecd4', borderRadius: '12px', padding: '14px 16px', fontSize: '12px', color: '#8a4f0a', lineHeight: '1.7' }}>
          ⚠️ 企業・投資家アカウントは2要素認証の設定を強く推奨します。認証アプリを削除した場合、アカウントにアクセスできなくなる可能性があります。
        </div>
      </div>
    </div>
  )
}
