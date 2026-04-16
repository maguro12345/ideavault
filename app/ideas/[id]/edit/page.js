'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../../components/Navbar'

export default function EditIdeaPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [pitchDecks, setPitchDecks] = useState([])
  const [deckUploading, setDeckUploading] = useState(false)
  const [originalIdea, setOriginalIdea] = useState(null)
  const [form, setForm] = useState({
    title: '', status: 'アイデア', category: [], visibility: 'public',
    concept: '', features: '', target: '',
    revenue: '', edge: '', launch: '', memo: ''
  })
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    await fetchCategories()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: idea } = await supabase.from('ideas').select('*').eq('id', params.id).single()
    if (!idea) { router.push('/'); return }
    if (idea.user_id !== user.id) { router.push('/'); return }
    setOriginalIdea(idea)
    setIsHidden(idea.is_hidden || false)
    setForm({
      title: idea.title || '',
      status: idea.status || 'アイデア',
      category: idea.category ? idea.category.split(', ').filter(Boolean) : [],
      visibility: idea.visibility || 'public',
      concept: idea.concept || '',
      features: idea.features || '',
      target: idea.target || '',
      revenue: idea.revenue || '',
      edge: idea.edge || '',
      launch: idea.launch || '',
      memo: idea.memo || ''
    })
    const { data: decks } = await supabase.from('pitch_decks').select('*').eq('idea_id', params.id).order('created_at', { ascending: false })
    setPitchDecks(decks || [])
    const { data: hist } = await supabase.from('idea_history').select('*').eq('idea_id', params.id).order('created_at', { ascending: false })
    setHistory(hist || [])
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('name').order('sort_order')
    setCategories(data?.map(c => c.name) || [])
  }

  async function uploadPitchDeck(e) {
    const file = e.target.files[0]
    if (!file) return
    setDeckUploading(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const fileType = file.type === 'application/pdf' ? 'pdf' : 'pptx'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('pitchdecks').upload(path, file, { upsert: true })
    if (error) { alert('アップロードエラー: ' + error.message); setDeckUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('pitchdecks').getPublicUrl(path)
    await supabase.from('pitch_decks').insert({
      user_id: user.id, idea_id: params.id,
      title: file.name.replace(/\.[^/.]+$/, ''),
      file_url: publicUrl, file_type: fileType
    })
    const { data: decks } = await supabase.from('pitch_decks').select('*').eq('idea_id', params.id).order('created_at', { ascending: false })
    setPitchDecks(decks || [])
    setDeckUploading(false)
    e.target.value = ''
  }

  async function deletePitchDeck(id) {
    if (!confirm('このピッチデックを削除しますか？')) return
    await supabase.from('pitch_decks').delete().eq('id', id)
    setPitchDecks(prev => prev.filter(d => d.id !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { alert('サービス名を入力してください'); return }
    setSaving(true)
    if (originalIdea) {
      await supabase.from('idea_history').insert({
        idea_id: params.id, user_id: user.id,
        title: originalIdea.title, concept: originalIdea.concept,
        features: originalIdea.features, target: originalIdea.target,
        revenue: originalIdea.revenue, edge: originalIdea.edge,
        launch: originalIdea.launch, memo: originalIdea.memo
      })
    }
    const { error } = await supabase.from('ideas').update({
      ...form,
      category: Array.isArray(form.category) ? form.category.join(', ') : form.category,
      is_hidden: isHidden,
      updated_at: new Date().toISOString()
    }).eq('id', params.id)
    if (error) { alert('エラー: ' + error.message); setSaving(false); return }
    router.push(`/ideas/${params.id}`)
  }

  async function toggleHidden() {
    const newHidden = !isHidden
    setIsHidden(newHidden)
    await supabase.from('ideas').update({ is_hidden: newHidden }).eq('id', params.id)
    alert(newHidden ? '投稿を非公開にしました' : '投稿を公開しました')
  }

  function getDiff(old, current, label) {
    if (!old || old === current) return null
    return { label, old, current }
  }

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const field = (label, name, placeholder, rows = 4) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>{label}</label>
      <textarea name={name} value={form[name]} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
        placeholder={placeholder} rows={rows}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box' }} />
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>企画を編集</h1>
          <button onClick={toggleHidden} style={{
            padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
            border: `1.5px solid ${isHidden ? '#BA7517' : 'rgba(0,0,0,0.15)'}`,
            background: isHidden ? '#faeeda' : '#fff',
            color: isHidden ? '#BA7517' : '#6b6b67', cursor: 'pointer'
          }}>{isHidden ? '🔒 非公開中' : '👁 公開中'}</button>
        </div>

        {isHidden && (
          <div style={{ background: '#faeeda', borderRadius: '12px', padding: '12px 16px', marginBottom: '1rem', fontSize: '13px', color: '#8a4f0a', fontWeight: '600' }}>
            🔒 この投稿は現在非公開です。他のユーザーには表示されません。
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 基本情報 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>基本情報</div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>サービス名 <span style={{ color: '#c04020' }}>*</span></label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例：AIレシピアプリ" required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>ステータス</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}>
                  {['アイデア','検討中','進行中','完成','一時停止'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>公開範囲</label>
                <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}>
                  <option value="public">全公開</option>
                  <option value="summary">概要のみ公開</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '8px' }}>カテゴリ <span style={{ fontWeight: '400', color: '#a0a09c' }}>（複数選択可）</span></label>
              {form.category.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {form.category.map(c => (
                    <span key={c} style={{ fontSize: '12px', background: '#E1F5EE', color: '#0d6e50', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {c}
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, category: prev.category.filter(x => x !== c) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d6e50', fontSize: '12px', padding: '0', lineHeight: 1 }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto', padding: '4px' }}>
                {categories.map(c => (
                  <button key={c} type="button" onClick={() => setForm(prev => ({ ...prev, category: prev.category.includes(c) ? prev.category.filter(x => x !== c) : [...prev.category, c] }))} style={{
                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                    border: `1px solid ${form.category.includes(c) ? '#1D9E75' : 'rgba(0,0,0,0.15)'}`,
                    background: form.category.includes(c) ? '#E1F5EE' : '#fff',
                    color: form.category.includes(c) ? '#0d6e50' : '#6b6b67',
                    fontWeight: form.category.includes(c) ? '600' : '400'
                  }}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          {/* 企画内容 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>企画内容</div>
            {field('コンセプト', 'concept', 'このサービスが解決する課題と提供する価値', 3)}
            {field('主な機能・サービス', 'features', '・機能1\n・機能2\n・機能3', 5)}
            {field('ターゲット', 'target', 'メインユーザー、サブユーザーを具体的に', 3)}
            {field('収益モデル', 'revenue', '・月額サブスク\n・手数料\n・広告 など', 4)}
            {field('差別化の本質', 'edge', '競合と何が根本的に違うのか', 4)}
            {field('立ち上げ戦略', 'launch', 'フェーズ別に記述してください', 5)}
            {field('メモ＆補足', 'memo', '競合調査、懸念点、次のアクションなど', 4)}
          </div>

          {/* ピッチデック */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>ピッチデック</div>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '12px', lineHeight: '1.7' }}>PDF・PowerPointファイルをアップロードできます。</div>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '10px', border: '2px dashed rgba(0,0,0,0.15)', cursor: 'pointer', marginBottom: '12px', background: '#fafafa' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#1D9E75'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'}>
              <span style={{ fontSize: '20px' }}>📎</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{deckUploading ? 'アップロード中...' : 'ファイルを追加'}</span>
              <span style={{ fontSize: '11px', color: '#a0a09c' }}>PDF・PPT・PPTX</span>
              <input type="file" accept=".pdf,.ppt,.pptx" onChange={uploadPitchDeck} style={{ display: 'none' }} disabled={deckUploading} />
            </label>

            {pitchDecks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f5f4f0', borderRadius: '10px', fontSize: '13px', color: '#a0a09c' }}>まだピッチデックがありません</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pitchDecks.map(deck => (
                  <div key={deck.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f5f4f0', borderRadius: '10px' }}>
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>{deck.file_type === 'pdf' ? '📄' : '📊'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.title}</div>
                      <div style={{ fontSize: '11px', color: '#a0a09c', textTransform: 'uppercase' }}>{deck.file_type}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <a href={deck.file_url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: '#fff', color: '#1D9E75', textDecoration: 'none', border: '1px solid #1D9E75' }}>開く</a>
                      <button type="button" onClick={() => deletePitchDeck(deck.id)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: '#fff', color: '#c04020', border: '1px solid #c04020', cursor: 'pointer' }}>削除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 編集履歴 */}
          {history.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '1rem' }}>
              <button type="button" onClick={() => setShowHistory(!showHistory)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18' }}>🕐 編集履歴（{history.length}件）</div>
                <span style={{ fontSize: '12px', color: '#6b6b67' }}>{showHistory ? '▲ 閉じる' : '▼ 開く'}</span>
              </button>
              {showHistory && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {history.map((h, idx) => {
                    const next = history[idx - 1]
                    const diffs = [
                      getDiff(h.title, next?.title, 'タイトル'),
                      getDiff(h.concept, next?.concept, 'コンセプト'),
                      getDiff(h.features, next?.features, '機能'),
                      getDiff(h.target, next?.target, 'ターゲット'),
                      getDiff(h.revenue, next?.revenue, '収益モデル'),
                      getDiff(h.edge, next?.edge, '差別化'),
                      getDiff(h.launch, next?.launch, '戦略'),
                      getDiff(h.memo, next?.memo, 'メモ'),
                    ].filter(Boolean)
                    return (
                      <div key={h.id} style={{ background: '#f5f4f0', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75' }}>🕐 {formatDate(h.created_at)}</div>
                          <div style={{ fontSize: '10px', color: '#a0a09c' }}>タイムスタンプ証明</div>
                        </div>
                        {diffs.length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#6b6b67' }}>タイトル：{h.title}</div>
                        ) : diffs.map(d => (
                          <div key={d.label} style={{ marginBottom: '6px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b6b67', marginBottom: '3px' }}>{d.label}</div>
                            <div style={{ fontSize: '12px', color: '#c04020', background: '#fff0ee', borderRadius: '6px', padding: '4px 8px', marginBottom: '3px' }}>− {d.old?.slice(0, 80)}{d.old?.length > 80 ? '...' : ''}</div>
                            <div style={{ fontSize: '12px', color: '#0d6e50', background: '#f0faf6', borderRadius: '6px', padding: '4px 8px' }}>＋ {d.current?.slice(0, 80)}{d.current?.length > 80 ? '...' : ''}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <Link href={`/ideas/${params.id}`} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', textDecoration: 'none', display: 'inline-block' }}>キャンセル</Link>
            <button type="submit" disabled={saving} style={{ background: '#1D9E75', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}