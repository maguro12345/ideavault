'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterCompanyPage() {
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [auth, setAuth] = useState({ email: '', password: '' })
  const [form, setForm] = useState({
    company_name: '',
    company_type: '企業',
    industry: '',
    contact_name: '',
    company_description: ''
  })
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: auth.email, password: auth.password
    })
    if (error) { setError('メールアドレスかパスワードが違います'); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('is_company').eq('id', user.id).single()
    if (!profile?.is_company) { setError('法人アカウントではありません。通常のログインページをご利用ください。'); setLoading(false); return }
    router.push('/company/dashboard')
  }

  async function handleAuthSubmit(e) {
    e.preventDefault()
    if (!agreed) { setError('利用規約・プライバシーポリシーに同意してください'); return }
    setLoading(true)
    setError('')
    await supabase.auth.signOut()
    const { error } = await supabase.auth.signUp({ email: auth.email, password: auth.password })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    setStep(2)
  }

  async function handleProfileSubmit(e) {
    e.preventDefault()
    if (!form.company_name.trim()) { setError('会社名を入力してください'); return }
    if (!form.contact_name.trim()) { setError('担当者名を入力してください'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('認証エラーが発生しました'); setLoading(false); return }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: form.company_name.toLowerCase().replace(/\s/g, '_') + '_' + Date.now().toString(36),
      full_name: form.contact_name,
      is_company: true,
      company_name: form.company_name,
      company_type: form.company_type,
      industry: form.industry,
      contact_name: form.contact_name,
      company_description: form.company_description,
      bio: form.company_description
    })
    if (error) { setError('エラー: ' + error.message); setLoading(false); return }
    router.push('/company/dashboard')
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '10px',
    border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
  }

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: '600',
    color: '#6b6b67', marginBottom: '5px'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '440px', border: '0.5px solid rgba(0,0,0,0.1)' }}>

        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-1px', textDecoration: 'none', color: 'inherit' }}>
            IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
          </Link>
          <div style={{ display: 'inline-block', background: '#1a3a5c', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', marginTop: '8px', letterSpacing: '0.5px' }}>
            🏢 法人・投資家向け
          </div>
        </div>

        {/* ログイン・登録タブ */}
        <div style={{ display: 'flex', background: '#f5f4f0', borderRadius: '10px', padding: '3px', marginBottom: '1.5rem' }}>
          {[{ key: 'login', label: 'ログイン' }, { key: 'register', label: '新規登録' }].map(t => (
            <button key={t.key} onClick={() => { setMode(t.key); setError(''); setStep(1); setAgreed(false) }} style={{
              flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: mode === t.key ? '#1a3a5c' : 'none',
              color: mode === t.key ? '#fff' : '#6b6b67'
            }}>{t.label}</button>
          ))}
        </div>

        {/* ログイン */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>メールアドレス</label>
              <input type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })}
                placeholder="company@example.com" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>パスワード</label>
              <input type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })}
                placeholder="パスワード" required style={inputStyle} />
            </div>
            {error && <div style={{ background: '#fdeae4', color: '#c04020', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}>{loading ? '処理中...' : 'ログイン'}</button>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <Link href="/reset-password" style={{ fontSize: '12px', color: '#6b6b67', textDecoration: 'none' }}>パスワードをお忘れの方</Link>
            </div>
          </form>
        )}

        {/* 新規登録 Step1 */}
        {mode === 'register' && step === 1 && (
          <form onSubmit={handleAuthSubmit}>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.25rem', textAlign: 'center' }}>まずアカウントを作成してください</div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>メールアドレス <span style={{ color: '#c04020' }}>*</span></label>
              <input type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })}
                placeholder="company@example.com" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>パスワード <span style={{ color: '#c04020' }}>*</span></label>
              <input type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })}
                placeholder="8文字以上" required style={inputStyle} />
            </div>

            {/* 利用規約同意チェックボックス */}
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

            {error && <div style={{ background: '#fdeae4', color: '#c04020', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>}
            <button type="submit" disabled={loading || !agreed} style={{
              width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
              cursor: !agreed ? 'not-allowed' : 'pointer', opacity: loading || !agreed ? 0.6 : 1
            }}>{loading ? '処理中...' : '次へ →'}</button>
          </form>
        )}

        {/* 新規登録 Step2 */}
        {mode === 'register' && step === 2 && (
          <form onSubmit={handleProfileSubmit}>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.25rem', textAlign: 'center' }}>法人情報を入力してください</div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>アカウント種別 <span style={{ color: '#c04020' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['企業', '投資家', 'VC', 'エンジェル'].map(type => (
                  <button key={type} type="button" onClick={() => setForm({ ...form, company_type: type })} style={{
                    padding: '8px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                    border: `1.5px solid ${form.company_type === type ? '#1a3a5c' : 'rgba(0,0,0,0.1)'}`,
                    background: form.company_type === type ? '#eef2f7' : '#fff',
                    color: form.company_type === type ? '#1a3a5c' : '#6b6b67', cursor: 'pointer'
                  }}>{type}</button>
                ))}
              </div>
            </div>

            {[
              { label: '会社名・屋号', key: 'company_name', placeholder: '例：株式会社〇〇', required: true },
              { label: '業種', key: 'industry', placeholder: '例：IT・フードテック・ヘルスケア', required: false },
              { label: '担当者名', key: 'contact_name', placeholder: '例：田中 誠', required: true },
            ].map(({ label, key, placeholder, required }) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>{label} {required && <span style={{ color: '#c04020' }}>*</span>}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>事業内容・自己紹介</label>
              <textarea value={form.company_description} onChange={e => setForm({ ...form, company_description: e.target.value })}
                placeholder="どんな事業をしているか、どんなアイデアを探しているか" rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
            </div>

            {error && <div style={{ background: '#fdeae4', color: '#c04020', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}>{loading ? '登録中...' : '法人アカウントを作成'}</button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: '#6b6b67' }}>
          個人アカウントの方は
          <Link href="/login" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: '600', marginLeft: '4px' }}>こちら</Link>
        </div>
      </div>
    </div>
  )
}