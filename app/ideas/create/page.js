'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewIdeaPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', status: 'アイデア', category: '',
    concept: '', features: '', target: '',
    revenue: '', edge: '', launch: '', memo: ''
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { alert('サービス名を入力してください'); return }
    setLoading(true)

    const { error } = await supabase.from('ideas').insert({
      user_id: user.id,
      ...form
    })

    if (error) { alert('エラーが発生しました: ' + error.message); setLoading(false); return }
    router.push('/')
  }

  const field = (label, name, placeholder, rows = 4) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>{label}</label>
      <textarea
        name={name} value={form[name]} onChange={handleChange}
        placeholder={placeholder} rows={rows}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: '10px',
          border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px',
          outline: 'none', resize: 'vertical', lineHeight: '1.7',
          fontFamily: 'inherit', boxSizing: 'border-box'
        }}
      />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{
        background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)',
        padding: '0 1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 10
      }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: 'inherit' }}>
          IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
        </Link>
        <Link href="/" style={{ fontSize: '13px', color: '#6b6b67', textDecoration: 'none' }}>← フィードに戻る</Link>
      </nav>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>新しい企画を投稿</h1>

        <form onSubmit={handleSubmit}>
          {/* 基本情報 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>基本情報</div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
                サービス名 <span style={{ color: '#c04020' }}>*</span>
              </label>
              <input
                name="title" value={form.title} onChange={handleChange}
                placeholder="例：AIレシピアプリ" required
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '10px',
                  border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>ステータス</label>
                <select name="status" value={form.status} onChange={handleChange} style={{
                  width: '100%', padding: '9px 12px', borderRadius: '10px',
                  border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px',
                  background: '#fff', boxSizing: 'border-box'
                }}>
                  {['アイデア','検討中','進行中','完成','一時停止'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>カテゴリ</label>
                <input
                  name="category" value={form.category} onChange={handleChange}
                  placeholder="例：SaaS、フードテック…"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '10px',
                    border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 企画内容 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>企画内容</div>
            {field('コンセプト', 'concept', 'このサービスが解決する課題と提供する価値', 3)}
            {field('主な機能・サービス', 'features', '・機能1\n・機能2\n・機能3', 5)}
            {field('ターゲット', 'target', 'メインユーザー、サブユーザーを具体的に', 3)}
            {field('収益モデル', 'revenue', '・月額サブスク\n・手数料\n・広告 など', 4)}
            {field('差別化の本質', 'edge', '競合と何が根本的に違うのか', 4)}
            {field('立ち上げ戦略', 'launch', 'フェーズ別に記述してください', 5)}
            {field('メモ＆補足', 'memo', '競合調査、懸念点、次のアクションなど', 4)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Link href="/" style={{
              padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
              border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67',
              textDecoration: 'none', display: 'inline-block'
            }}>キャンセル</Link>
            <button type="submit" disabled={loading} style={{
              background: '#1D9E75', color: '#fff', border: 'none',
              padding: '10px 28px', borderRadius: '10px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer'
            }}>
              {loading ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}