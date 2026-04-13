 'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterCompanyPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  async function handleAuthSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    await supabase.auth.signOut()
    const { data, error } = await supabase.auth.signUp({
      email: auth.email,
      password: auth.password
    })
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
    router.push('/')
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
            🏢 法人アカウント登録
          </div>
          <div style={{ fontSize: '13px', color: '#6b6b67', marginTop: '8px' }}>
            {step === 1 ? 'まずアカウントを作成してください' : '法人情報を入力してください'}
          </div>

          {/* ステップインジケーター */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '700',
                  background: step >= s ? '#1a3a5c' : '#f0eeea',
                  color: step >= s ? '#fff' : '#a0a09c'
                }}>{s}</div>
                {s < 2 && <div style={{ width: '32px', height: '2px', background: step > s ? '#1a3a5c' : '#f0eeea', borderRadius: '1px' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: 認証情報 */}
        {step === 1 && (
          <form onSubmit={handleAuthSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>メールアドレス <span style={{ color: '#c04020' }}>*</span></label>
              <input type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })}
                placeholder="company@example.com" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>パスワード <span style={{ color: '#c04020' }}>*</span></label>
              <input type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })}
                placeholder="8文字以上" required style={inputStyle} />
            </div>
            {error && <div style={{ background: '#fdeae4', color: '#c04020', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}>{loading ? '処理中...' : '次へ →'}</button>
          </form>
        )}

        {/* Step 2: 法人情報 */}
        {step === 2 && (
          <form onSubmit={handleProfileSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>アカウント種別 <span style={{ color: '#c04020' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['企業', '投資家', 'VC', 'エンジェル'].map(type => (
                  <button key={type} type="button" onClick={() => setForm({ ...form, company_type: type })} style={{
                    padding: '8px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                    border: `1.5px solid ${form.company_type === type ? '#1a3a5c' : 'rgba(0,0,0,0.1)'}`,
                    background: form.company_type === type ? '#eef2f7' : '#fff',
                    color: form.company_type === type ? '#1a3a5c' : '#6b6b67',
                    cursor: 'pointer'
                  }}>{type}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>会社名・屋号 <span style={{ color: '#c04020' }}>*</span></label>
              <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}
                placeholder="例：株式会社〇〇" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>業種</label>
              <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
                placeholder="例：IT・フードテック・ヘルスケア" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>担当者名 <span style={{ color: '#c04020' }}>*</span></label>
              <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })}
                placeholder="例：田中 誠" style={inputStyle} />
            </div>

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

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '13px', color: '#6b6b67' }}>
          個人アカウントの方は
          <Link href="/login" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: '600', marginLeft: '4px' }}>こちら</Link>
        </div>
      </div>
    </div>
  )
}
