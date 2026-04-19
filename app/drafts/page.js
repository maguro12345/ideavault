'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/Navbar'

export default function DraftsPage() {
  const [user, setUser] = useState(null)
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await fetchDrafts(user.id)
    setLoading(false)
  }

  async function fetchDrafts(userId) {
    const { data } = await supabase.from('ideas')
      .select('*').eq('user_id', userId).eq('is_draft', true)
      .order('draft_saved_at', { ascending: false })
    setDrafts(data || [])
  }

  async function deleteDraft(id) {
    if (!confirm('この下書きを削除しますか？')) return
    await supabase.from('ideas').delete().eq('id', id)
    await fetchDrafts(user.id)
  }

  async function publishDraft(id) {
    if (!confirm('この下書きを公開しますか？')) return
    await supabase.from('ideas').update({ is_draft: false, is_hidden: false }).eq('id', id)
    router.push(`/ideas/${id}`)
  }

  function formatDate(ts) {
    if (!ts) return '不明'
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>📝 下書き一覧</h1>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginTop: '4px' }}>{drafts.length}件の下書きがあります</div>
          </div>
          <Link href="/ideas/create" style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', textDecoration: 'none' }}>＋ 新規作成</Link>
        </div>

        {drafts.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📝</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '6px' }}>下書きがありません</div>
            <Link href="/ideas/create" style={{ fontSize: '13px', color: '#1D9E75', fontWeight: '600', textDecoration: 'none' }}>新しいアイデアを書く →</Link>
          </div>
        ) : drafts.map(draft => (
          <div key={draft.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {draft.title || '（タイトル未設定）'}
                </div>
                {draft.concept && (
                  <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '8px' }}>
                    {draft.concept}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', background: '#fdecd4', color: '#8a4f0a', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>📝 下書き</span>
                  {draft.category && <span style={{ fontSize: '11px', background: '#f0eeea', color: '#6b6b67', padding: '2px 8px', borderRadius: '20px' }}>{draft.category.split(', ')[0]}</span>}
                  <span style={{ fontSize: '11px', color: '#a0a09c' }}>最終保存：{formatDate(draft.draft_saved_at || draft.created_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => router.push(`/ideas/create?draft=${draft.id}`)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: '#1a1a18', color: '#fff', border: 'none', cursor: 'pointer' }}>編集</button>
                <button onClick={() => publishDraft(draft.id)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>公開</button>
                <button onClick={() => deleteDraft(draft.id)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: '#fff', color: '#c04020', border: '1px solid #c04020', cursor: 'pointer' }}>削除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}