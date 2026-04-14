'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === 'production'

export default function AdminPage() {
  const [categories, setCategories] = useState([])
  const [newCat, setNewCat] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (IS_PRODUCTION) { router.push('/'); return }
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await fetchCategories()
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
  }

  async function addCategory() {
    if (!newCat.trim()) return
    setSaving(true)
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0
    const { error } = await supabase.from('categories').insert({ name: newCat.trim(), sort_order: maxOrder + 1 })
    if (error) { alert('エラー: ' + error.message); setSaving(false); return }
    setNewCat('')
    await fetchCategories()
    setSaving(false)
  }

  async function deleteCategory(id) {
    if (!confirm('このカテゴリを削除しますか？')) return
    await supabase.from('categories').delete().eq('id', id)
    await fetchCategories()
  }

  async function moveUp(index) {
    if (index === 0) return
    const a = categories[index]
    const b = categories[index - 1]
    await supabase.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id)
    await fetchCategories()
  }

  async function moveDown(index) {
    if (index === categories.length - 1) return
    const a = categories[index]
    const b = categories[index + 1]
    await supabase.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id)
    await fetchCategories()
  }

  if (IS_PRODUCTION) return null

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.5px' }}>カテゴリ管理</h1>
        <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.5rem' }}>
          ここで追加・削除・並び替えができます。変更は即座に投稿フォームに反映されます。
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px' }}>新しいカテゴリを追加</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              placeholder="例：ウェルネス・メンタルヘルス"
              style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none' }}
            />
            <button onClick={addCategory} disabled={saving || !newCat.trim()} style={{
              padding: '9px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
              background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer',
              opacity: saving || !newCat.trim() ? 0.6 : 1
            }}>追加</button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18' }}>カテゴリ一覧</div>
            <div style={{ fontSize: '12px', color: '#a0a09c' }}>{categories.length}件</div>
          </div>
          {categories.map((cat, i) => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '12px', color: '#a0a09c', width: '24px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: '14px', color: '#1a1a18' }}>{cat.name}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} style={{ padding: '4px 8px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => moveDown(i)} disabled={i === categories.length - 1} style={{ padding: '4px 8px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', cursor: i === categories.length - 1 ? 'not-allowed' : 'pointer', opacity: i === categories.length - 1 ? 0.3 : 1 }}>↓</button>
                <button onClick={() => deleteCategory(cat.id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#c04020' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}