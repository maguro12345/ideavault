'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/Navbar'

export default function NewIdeaPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title: '', status: 'アイデア', category: [],
    concept: '', features: '', target: '',
    revenue: '', edge: '', launch: '', memo: ''
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { checkUser(); fetchCategories() }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('name').order('sort_order')
    setCategories(data?.map(c => c.name) || [])
  }

  function toggleCategory(cat) {
    setForm(prev => {
      const current = prev.category
      if (current.includes(cat)) {
        return { ...prev, category: current.filter(c => c !== cat) }
      } else {
        return { ...prev, category: [...current, cat] }
      }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { alert('サービス名を入力してください'); return }
    setLoading(true)

    const { error } = await supabase.from('ideas').insert({
      user_id: user.id,
      ...form,
      category: form.category.join(', ')
    })

    if (error) { alert('エラーが発生しました: ' + error.message); setLoading(false); return }
    router.push('/')
  }

  const field = (label, name, placeholder, rows = 4) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>{label}</label>
      <textarea
        name={name} value={form[name]} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
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
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>新しい企画を投稿</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>基本情報</div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
                サービス名 <span style={{ color: '#c04020' }}>*</span>
              </label>
              <input
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="例：AIレシピアプリ" required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>ステータス</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{
                width: '100%', padding: '9px 12px', borderRadius: '10px',
                border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px',
                background: '#fff', boxSizing: 'border-box'
              }}>
                {['アイデア','検討中','進行中','完成','一時停止'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '8px' }}>
                カテゴリ <span style={{ fontWeight: '400', color: '#a0a09c' }}>（複数選択可）</span>
              </label>
              {form.category.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {form.category.map(c => (
                    <span key={c} style={{ fontSize: '12px', background: '#E1F5EE', color: '#0d6e50', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {c}
                      <button type="button" onClick={() => toggleCategory(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d6e50', fontSize: '12px', padding: '0', lineHeight: 1 }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '160px', overflowY: 'auto', padding: '4px' }}>
                {categories.map(c => (
                  <button key={c} type="button" onClick={() => toggleCategory(c)} style={{
                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${form.category.includes(c) ? '#1D9E75' : 'rgba(0,0,0,0.15)'}`,
                    background: form.category.includes(c) ? '#E1F5EE' : '#fff',
                    color: form.category.includes(c) ? '#0d6e50' : '#6b6b67',
                    fontWeight: form.category.includes(c) ? '600' : '400',
                    transition: 'all 0.1s'
                  }}>{c}</button>
                ))}
              </div>
            </div>
          </div>

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
              fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}