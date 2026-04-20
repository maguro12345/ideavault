 'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import Link from 'next/link'
import Navbar from '../../components/Navbar'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', category: 'general', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { alert('すべての項目を入力してください'); return }
    setSending(true)
    await supabase.from('reports').insert({
      reporter_id: null,
      target_type: 'contact',
      target_id: '00000000-0000-0000-0000-000000000000',
      reason: form.category,
      detail: `【氏名】${form.name}\n【メール】${form.email}\n【内容】${form.message}`,
      status: 'pending'
    })
    setSending(false)
    setSent(true)
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.5px' }}>お問い合わせ</h1>
        <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.5rem' }}>ご質問・ご要望・不具合のご報告はこちらから</div>

        {sent ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #1D9E75', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d6e50', marginBottom: '6px' }}>送信しました！</div>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.5rem' }}>2営業日以内にご登録のメールアドレスへご返信いたします。</div>
            <Link href="/" style={{ display: 'inline-block', padding: '9px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', textDecoration: 'none' }}>トップページへ</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>お名前 <span style={{ color: '#c04020' }}>*</span></label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例：田中 誠" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>メールアドレス <span style={{ color: '#c04020' }}>*</span></label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="例：tanaka@example.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>お問い合わせ種別</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                  <option value="general">一般的なご質問</option>
                  <option value="bug">不具合・バグの報告</option>
                  <option value="billing">料金・お支払いについて</option>
                  <option value="account">アカウントについて</option>
                  <option value="violation">規約違反の報告</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>お問い合わせ内容 <span style={{ color: '#c04020' }}>*</span></label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="できるだけ詳しくご記載ください" rows={6}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
              </div>
              <button type="submit" disabled={sending} style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
                {sending ? '送信中...' : '送信する'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
