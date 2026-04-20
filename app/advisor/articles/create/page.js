 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import AdvisorNavbar from '../../../../components/AdvisorNavbar'

export default function CreateArticlePage() {
  const [user, setUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '' })
  const router = useRouter()
  const supabase = createClient()

  const CATEGORIES = ['起業家精神', '資金調達', '法務・契約', 'マーケティング', 'プロダクト開発', 'チームビルディング', '財務・会計', 'その他']

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('company_type').eq('id', user.id).single()
    if (prof?.company_type !== 'アドバイザー') { router.push('/'); return }
    setUser(user)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) { alert('タイトルと本文を入力してください'); return }
    setSaving(true)
    const { data, error } = await supabase.from('advisor_articles').insert({
      author_id: user.id, ...form, is_published: true
    }).select().single()
    if (error) { alert('エラー: ' + error.message); setSaving(false); return }
    router.push(`/advisor/articles/${data.id}`)
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0ff', fontFamily: 'system-ui, sans-serif' }}>
      <AdvisorNavbar />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>✍️ 記事を投稿</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>タイトル <span style={{ color: '#c04020' }}>*</span></label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例：資金調達で失敗しないための5つのポイント" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>カテゴリ</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, category: c === form.category ? '' : c })} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: `1px solid ${form.category === c ? '#7F77DD' : 'rgba(0,0,0,0.15)'}`, background: form.category === c ? '#EEEDFE' : '#fff', color: form.category === c ? '#534AB7' : '#6b6b67', fontWeight: form.category === c ? '600' : '400' }}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>本文 <span style={{ color: '#c04020' }}>*</span></label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="起業家へのアドバイス、ノウハウ、経験談などを書いてください..." rows={16}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.9' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => router.back()} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: '#fff', cursor: 'pointer' }}>キャンセル</button>
              <button type="submit" disabled={saving} style={{ padding: '10px 28px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#2d1f5e', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '投稿中...' : '投稿する'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
