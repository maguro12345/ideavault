'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [agreed, setAgreed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    if (isSignUp && !agreed) {
      setError('利用規約・プライバシーポリシーに同意してください')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setMessage('確認メールを送りました。メールを確認してください。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('メールアドレスかパスワードが違います'); setLoading(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('is_company, full_name, username').eq('id', user.id).single()
      if (profile?.is_company) {
        router.push('/company/dashboard')
      } else {
        router.push('/onboarding')
      }
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', border: '0.5px solid rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-1px', textDecoration: 'none', color: 'inherit' }}>
            IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
          </Link>
          <div style={{ fontSize: '13px', color: '#6b6b67', marginTop: '6px' }}>
            {isSignUp ? 'アカウントを作成' : 'ログイン'}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>メールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: isSignUp ? '1rem' : '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>パスワード</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="8文字以上"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {!isSignUp && (
            <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
              <Link href="/reset-password" style={{ fontSize: '12px', color: '#6b6b67', textDecoration: 'none' }}>パスワードをお忘れの方</Link>
            </div>
          )}

          {/* 新規登録時のみ利用規約同意チェックボックス */}
          {isSignUp && (
            <div style={{ marginBottom: '1.25rem', padding: '12px', background: '#f5f4f0', borderRadius: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.7' }}>
                  <Link href="/terms" target="_blank" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: '600' }}>利用規約</Link>
                  {' '}および{' '}
                  <Link href="/privacy" target="_blank" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: '600' }}>プライバシーポリシー</Link>
                  {' '}を読み、同意します
                </span>
              </label>
            </div>
          )}

          {error && (
            <div style={{ background: '#fdeae4', color: '#c04020', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>
          )}
          {message && (
            <div style={{ background: '#d8f2ea', color: '#0d6e50', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>{message}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px', background: '#1D9E75', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}>
            {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); setAgreed(false) }}
            style={{ background: 'none', border: 'none', color: '#1D9E75', fontSize: '13px', cursor: 'pointer' }}>
            {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Link href="/register-company" style={{ fontSize: '12px', color: '#6b6b67', textDecoration: 'none', borderBottom: '1px solid rgba(0,0,0,0.15)', paddingBottom: '1px' }}>
            🏢 法人・投資家の方はこちら
          </Link>
        </div>
      </div>
    </div>
  )
}