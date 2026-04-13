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
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
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
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f4f0', padding: '1rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '2rem',
        width: '100%', maxWidth: '400px',
        border: '0.5px solid rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-1px' }}>
            IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
          </div>
          <div style={{ fontSize: '13px', color: '#6b6b67', marginTop: '6px' }}>
            {isSignUp ? 'アカウントを作成' : 'ログイン'}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
              メールアドレス
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="you@example.com"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '10px',
                border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
              パスワード
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="8文字以上"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '10px',
                border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fdeae4', color: '#c04020', padding: '10px 12px',
              borderRadius: '8px', fontSize: '13px', marginBottom: '1rem'
            }}>{error}</div>
          )}

          {message && (
            <div style={{
              background: '#d8f2ea', color: '#0d6e50', padding: '10px 12px',
              borderRadius: '8px', fontSize: '13px', marginBottom: '1rem'
            }}>{message}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '10px', background: '#1D9E75',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer'
            }}
          >
            {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            style={{
              background: 'none', border: 'none', color: '#1D9E75',
              fontSize: '13px', cursor: 'pointer'
            }}
          >
            {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Link href="/register-company" style={{
            fontSize: '12px', color: '#6b6b67', textDecoration: 'none',
            borderBottom: '1px solid rgba(0,0,0,0.15)', paddingBottom: '1px'
          }}>
            🏢 法人・投資家の方はこちら
          </Link>
        </div>
      </div>
    </div>
  )
}