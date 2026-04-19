'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import CompanyNavbar from '../../../components/CompanyNavbar'

export default function RecruitPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [postings, setPostings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', industry: '', scale: '', budget: '', keywords: '' })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof?.is_company) { router.push('/'); return }
    setProfile(prof)
    await fetchPostings(user.id)
    setLoading(false)
  }

  async function fetchPostings(userId) {
    const { data } = await supabase.from('job_postings').select('*').eq('company_id', userId).order('created_at', { ascending: false })
    setPostings(data || [])
  }

  async function savePosting() {
    if (!form.title.trim()) { alert('タイトルを入力してください'); return }
    setSaving(true)
    await supabase.from('job_postings').insert({ company_id: user.id, ...form })
    setForm({ title: '', description: '', industry: '', scale: '', budget: '', keywords: '' })
    setShowForm(false)
    await fetchPostings(user.id)
    setSaving(false)
  }

  async function deletePosting(id) {
    if (!confirm('この募集を削除しますか？')) return
    await supabase.from('job_postings').delete().eq('id', id)
    await fetchPostings(user.id)
  }

  async function toggleStatus(id, current) {
    const next = current === 'open' ? 'closed' : 'open'
    await supabase.from('job_postings').update({ status: next }).eq('id', id)
    await fetchPostings(user.id)
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      <CompanyNavbar />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>📢 アイデア募集</h1>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginTop: '4px' }}>募集はトップページに掲載されます</div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', background: '#1a3a5c', color: '#fff', border: 'none', cursor: 'pointer' }}>
            ＋ 募集を作成
          </button>
        </div>

        {/* 作成フォーム */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1.5px solid #1a3a5c', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '1.25rem' }}>新しい募集を作成</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>募集タイトル <span style={{ color: '#c04020' }}>*</span></label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例：フードテック分野のアイデアを募集します" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>募集内容・詳細</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="どんなアイデアを探しているか、一緒に何をしたいかを具体的に" rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>業種・分野</label>
                <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="例：フードテック・IT・ヘルスケア" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>企業規模</label>
                <select value={form.scale} onChange={e => setForm({ ...form, scale: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                  <option value="">選択してください</option>
                  {['スタートアップ（1〜10名）', '中小企業（11〜100名）', '中堅企業（101〜500名）', '大企業（501名以上）'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>提供できる予算・リソース（任意）</label>
              <input value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="例：初期投資500万円・開発チーム提供" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>キーワード（カンマ区切り）</label>
              <input value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="例：AI, 農業, サブスク" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: '#fff', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={savePosting} disabled={saving} style={{ padding: '9px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1a3a5c', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '作成中...' : '募集を作成する'}</button>
            </div>
          </div>
        )}

        {/* 募集一覧 */}
        {postings.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📢</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' }}>まだ募集がありません</div>
            <div style={{ fontSize: '13px', color: '#6b6b67' }}>募集を作成するとトップページに掲載されます</div>
          </div>
        ) : postings.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{p.title}</div>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', background: p.status === 'open' ? '#d8f2ea' : '#f0eeea', color: p.status === 'open' ? '#0d6e50' : '#6b6b67' }}>{p.status === 'open' ? '募集中' : '終了'}</span>
                </div>
                {p.description && <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.6', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {p.industry && <span style={{ fontSize: '11px', background: '#eef2f7', color: '#1a3a5c', padding: '2px 8px', borderRadius: '20px' }}>{p.industry}</span>}
                  {p.scale && <span style={{ fontSize: '11px', background: '#f0eeea', color: '#6b6b67', padding: '2px 8px', borderRadius: '20px' }}>{p.scale}</span>}
                  {p.budget && <span style={{ fontSize: '11px', background: '#d8f2ea', color: '#0d6e50', padding: '2px 8px', borderRadius: '20px' }}>💰 {p.budget}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => toggleStatus(p.id, p.status)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', color: '#6b6b67', cursor: 'pointer' }}>{p.status === 'open' ? '終了にする' : '再開する'}</button>
                <button onClick={() => deletePosting(p.id)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', border: '0.5px solid #c04020', background: '#fff', color: '#c04020', cursor: 'pointer' }}>削除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}