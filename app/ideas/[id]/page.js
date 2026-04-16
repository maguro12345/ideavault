'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/Navbar'

export default function IdeaDetailPage() {
  const [idea, setIdea] = useState(null)
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [watched, setWatched] = useState(false)
  const [watchCount, setWatchCount] = useState(0)
  const [showMessage, setShowMessage] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reporting, setReporting] = useState(false)
  const [comments, setComments] = useState([])
  const [pitchDecks, setPitchDecks] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [progress, setProgress] = useState([])
  const [showProgress, setShowProgress] = useState(false)
  const [progressForm, setProgressForm] = useState({ stage: 'アイデア', title: '', content: '' })
  const [views, setViews] = useState([])
  const [showViews, setShowViews] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserProfile(prof)
      const { data: likeData } = await supabase.from('likes').select('id').eq('user_id', user.id).eq('idea_id', params.id).single()
      setLiked(!!likeData)
      const { data: watchData } = await supabase.from('watches').select('id').eq('user_id', user.id).eq('idea_id', params.id).single()
      setWatched(!!watchData)
    }
    await getIdea()
    await getComments()
    await getProgress()
    if (user) {
      await supabase.from('idea_views').insert({ idea_id: params.id, viewer_id: user.id })
    }
  }

  async function getIdea() {
    const { data } = await supabase.from('ideas')
      .select('*, profiles(id, username, full_name, bio, is_company, company_name, avatar_url)')
      .eq('id', params.id).single()
    setIdea(data)
    const { count: lc } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('idea_id', params.id)
    setLikeCount(lc || 0)
    const { count: wc } = await supabase.from('watches').select('*', { count: 'exact', head: true }).eq('idea_id', params.id)
    setWatchCount(wc || 0)
    setLoading(false)
    const { data: decks } = await supabase.from('pitch_decks').select('*').eq('user_id', data?.user_id || '').order('created_at', { ascending: false })
    setPitchDecks(decks || [])
  }

  async function getComments() {
    const { data } = await supabase.from('idea_comments')
      .select('*, profiles(id, full_name, username, avatar_url, role)')
      .eq('idea_id', params.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function getPitchDecks() {
    const { data } = await supabase.from('pitch_decks')
      .select('*').eq('user_id', idea?.user_id || '')
      .order('created_at', { ascending: false })
    setPitchDecks(data || [])
  }

  async function getProgress() {
    const { data } = await supabase.from('idea_progress')
      .select('*').eq('idea_id', params.id).order('created_at', { ascending: true })
    setProgress(data || [])
  }

  async function getViews() {
    const { data } = await supabase.from('idea_views')
      .select('*, profiles(id, full_name, username, avatar_url, is_company, company_name)')
      .eq('idea_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50)
    const uniqueViews = []
    const seen = new Set()
    for (const v of data || []) {
      if (v.viewer_id && !seen.has(v.viewer_id)) {
        seen.add(v.viewer_id)
        uniqueViews.push(v)
      }
    }
    setViews(uniqueViews)
  }

  async function toggleLike() {
    if (!user) { router.push('/login'); return }
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('idea_id', params.id)
      setLiked(false); setLikeCount(prev => prev - 1)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, idea_id: params.id })
      setLiked(true); setLikeCount(prev => prev + 1)
      if (user.id !== idea.profiles.id) {
        await supabase.from('notifications').insert({ user_id: idea.profiles.id, from_id: user.id, type: 'like', idea_id: params.id })
      }
    }
  }

  async function toggleWatch() {
    if (!user) { router.push('/login'); return }
    if (watched) {
      await supabase.from('watches').delete().eq('user_id', user.id).eq('idea_id', params.id)
      setWatched(false); setWatchCount(prev => prev - 1)
    } else {
      await supabase.from('watches').insert({ user_id: user.id, idea_id: params.id })
      setWatched(true); setWatchCount(prev => prev + 1)
      if (user.id !== idea.profiles.id) {
        await supabase.from('notifications').insert({ user_id: idea.profiles.id, from_id: user.id, type: 'watch', idea_id: params.id })
      }
    }
  }

  async function sendMessage() {
    if (!messageContent.trim()) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: idea.profiles.id, idea_id: params.id, content: messageContent.trim() })
    if (error) { alert('エラー: ' + error.message); setSending(false); return }
    setSending(false); setSent(true); setMessageContent('')
    setTimeout(() => { setShowMessage(false); setSent(false) }, 2000)
  }

  async function postComment() {
    if (!commentContent.trim() || !user) return
    setPostingComment(true)
    await supabase.from('idea_comments').insert({
      idea_id: params.id, user_id: user.id, content: commentContent.trim(),
      is_mentor: userProfile?.role === 'mentor'
    })
    setCommentContent('')
    await getComments()
    setPostingComment(false)
  }

  async function deleteComment(id) {
    if (!confirm('コメントを削除しますか？')) return
    await supabase.from('idea_comments').delete().eq('id', id)
    await getComments()
  }

  async function addProgress() {
    if (!progressForm.title.trim()) { alert('タイトルを入力してください'); return }
    await supabase.from('idea_progress').insert({ idea_id: params.id, user_id: user.id, ...progressForm })
    setProgressForm({ stage: 'アイデア', title: '', content: '' })
    setShowProgress(false)
    await getProgress()
  }

  async function submitReport() {
    if (!reportReason) { alert('理由を選択してください'); return }
    setReporting(true)
    await supabase.from('reports').insert({ reporter_id: user.id, target_type: 'idea', target_id: params.id, reason: reportReason, detail: reportDetail })
    setReporting(false); setShowReport(false); setReportReason(''); setReportDetail('')
    alert('通報を受け付けました。確認後に対応します。')
  }

  async function handleDelete() {
    if (!confirm('このアイデアを削除しますか？')) return
    await supabase.from('ideas').delete().eq('id', params.id)
    router.push('/')
  }

  const BADGE = {
    'アイデア':  { bg: '#deeefb', color: '#1255a0' },
    '検討中':    { bg: '#fdecd4', color: '#8a4f0a' },
    '進行中':    { bg: '#d8f2ea', color: '#0d6e50' },
    '完成':      { bg: '#e4f2d8', color: '#376b10' },
    '一時停止':  { bg: '#eeecea', color: '#5a5a56' },
  }

  const STAGES = ['アイデア', '検証中', 'MVP開発', 'ベータ版', 'ローンチ', '成長期']

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`
  }

  const sec = (num, label, value) => {
    if (!value) return null
    if (!user && num > 1) {
      return (
        <div style={{ padding: '1.1rem 0', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1D9E75', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18' }}>{label}</div>
          </div>
          <div style={{ padding: '12px', background: '#f5f4f0', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b6b67', marginBottom: '8px' }}>会員登録後に閲覧できます</div>
            <Link href="/login" style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '600', textDecoration: 'none' }}>無料で登録 →</Link>
          </div>
        </div>
      )
    }
    return (
      <div style={{ padding: '1.1rem 0', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1D9E75', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18' }}>{label}</div>
        </div>
        <div style={{ fontSize: '14px', color: '#6b6b67', lineHeight: '1.9', whiteSpace: 'pre-wrap', paddingLeft: '30px' }}>{value}</div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  if (!idea) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>アイデアが見つかりませんでした</div>
    </div>
  )

  const profile = idea.profiles
  const name = profile?.is_company ? profile.company_name : profile?.full_name || profile?.username || '名無し'
  const badge = BADGE[idea.status] || BADGE['アイデア']
  const isOwner = user?.id === profile?.id

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* ヘッダーカード */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a18', letterSpacing: '-0.5px', lineHeight: '1.3' }}>{idea.title}</h1>
            <span style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, background: badge.bg, color: badge.color }}>{idea.status}</span>
          </div>

          {/* タイムスタンプ証明 */}
          <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '10px 14px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px' }}>🕐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: '#a0a09c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>タイムスタンプ証明</div>
              <div style={{ fontSize: '12px', color: '#6b6b67', marginTop: '2px' }}>投稿日時：{new Date(idea.created_at).toLocaleString('ja-JP')} ／ ID：{idea.id}</div>
            </div>
            <button onClick={() => {
              const text = `IdeaVault タイムスタンプ証明\nタイトル: ${idea.title}\n投稿日時: ${new Date(idea.created_at).toLocaleString('ja-JP')}\nID: ${idea.id}\nURL: ${window.location.href}`
              navigator.clipboard.writeText(text)
              alert('タイムスタンプ情報をコピーしました')
            }} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', color: '#6b6b67', cursor: 'pointer', whiteSpace: 'nowrap' }}>コピー</button>
          </div>

          {/* 投稿者 */}
          <div onClick={() => router.push(`/profile/${profile?.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden' }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18' }}>{name}</div>
                {profile?.is_verified && <span style={{ fontSize: '11px', background: '#d8f2ea', color: '#0d6e50', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>✅ 認証済み</span>}
                {profile?.is_company && !profile?.is_verified && <span style={{ fontSize: '11px', background: '#eef2f7', color: '#1a3a5c', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>🏢 法人</span>}
              </div>
              {profile?.bio && <div style={{ fontSize: '12px', color: '#6b6b67' }}>{profile.bio}</div>}
            </div>
            {idea.category && <span style={{ marginLeft: 'auto', fontSize: '11px', background: '#f0eeea', padding: '3px 9px', borderRadius: '20px', color: '#6b6b67', flexShrink: 0 }}>{idea.category}</span>}
          </div>

          {!user && (
            <div style={{ background: '#f0eeea', borderRadius: '12px', padding: '14px 16px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: '#6b6b67' }}>詳細・収益モデルは会員登録後に閲覧できます</div>
              <Link href="/login" style={{ background: '#1D9E75', color: '#fff', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap' }}>無料で登録</Link>
            </div>
          )}

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={toggleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: `1px solid ${liked ? '#e74c3c' : 'rgba(0,0,0,0.15)'}`, background: liked ? '#fff0f0' : '#fff', color: liked ? '#e74c3c' : '#6b6b67', cursor: 'pointer' }}>
              {liked ? '❤️' : '🤍'} {likeCount}
            </button>

            <button onClick={toggleWatch} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: `1px solid ${watched ? '#BA7517' : 'rgba(0,0,0,0.15)'}`, background: watched ? '#faeeda' : '#fff', color: watched ? '#BA7517' : '#6b6b67', cursor: 'pointer' }}>
              {watched ? '👁️' : '👁'} ウォッチ {watchCount}
            </button>

            <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(idea.title + ' - IdeaVault')}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(0,0,0,0.15)', background: '#fff', color: '#1a1a18', cursor: 'pointer' }}>𝕏 シェア</button>

            <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('URLをコピーしました！') }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(0,0,0,0.15)', background: '#fff', color: '#1a1a18', cursor: 'pointer' }}>🔗 コピー</button>

            {user && !isOwner && (
              <button onClick={() => setShowMessage(true)} style={{ background: '#1D9E75', color: '#fff', padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>✉️ メッセージ</button>
            )}
            {user && !isOwner && (
              <button onClick={() => setShowReport(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', fontSize: '13px', border: '1px solid rgba(0,0,0,0.15)', background: '#fff', color: '#c04020', cursor: 'pointer' }}>🚩</button>
            )}
            {isOwner && (
              <>
                <button onClick={async () => { await getViews(); setShowViews(true) }} style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: '#fff', cursor: 'pointer' }}>👁 閲覧ログ</button>
                <div onClick={() => router.push(`/ideas/${idea.id}/edit`)} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', cursor: 'pointer' }}>編集</div>
                <button onClick={handleDelete} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#c04020', background: 'none', cursor: 'pointer' }}>削除</button>
              </>
            )}
          </div>
        </div>

        {/* メッセージパネル */}
        {showMessage && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #1D9E75', padding: '1.25rem', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px' }}>{name}さんにメッセージを送る</div>
            {sent ? (
              <div style={{ background: '#d8f2ea', color: '#0d6e50', padding: '12px', borderRadius: '10px', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>✓ 送信しました！</div>
            ) : (
              <>
                <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} placeholder={`${name}さんへのメッセージ...`} rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '10px' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={() => { setShowMessage(false); setMessageContent('') }} style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: 'none', cursor: 'pointer' }}>キャンセル</button>
                  <button onClick={sendMessage} disabled={sending || !messageContent.trim()} style={{ padding: '8px 22px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
                    {sending ? '送信中...' : '送信する'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 詳細セクション */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '0.5rem 1.5rem 1rem', marginBottom: '12px' }}>
          {sec(1, 'コンセプト', idea.concept)}
          {sec(2, '主な機能・サービス', idea.features)}
          {sec(3, 'ターゲット', idea.target)}
          {sec(4, '収益モデル', idea.revenue)}
          {sec(5, '差別化の本質', idea.edge)}
          {sec(6, '立ち上げ戦略', idea.launch)}
          {sec(7, 'メモ＆補足', idea.memo)}
        </div>

        {/* 進捗タイムライン */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>📈 進捗タイムライン</div>
            {isOwner && (
              <button onClick={() => setShowProgress(!showProgress)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>＋ 追加</button>
            )}
          </div>

          {showProgress && isOwner && (
            <div style={{ background: '#f5f4f0', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <select value={progressForm.stage} onChange={e => setProgressForm({ ...progressForm, stage: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', background: '#fff', marginBottom: '8px' }}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
                <input value={progressForm.title} onChange={e => setProgressForm({ ...progressForm, title: e.target.value })} placeholder="タイトル（例：ランディングページ完成）"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
                <textarea value={progressForm.content} onChange={e => setProgressForm({ ...progressForm, content: e.target.value })} placeholder="詳細（任意）" rows={2}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowProgress(false)} style={{ padding: '6px 14px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#6b6b67' }}>キャンセル</button>
                <button onClick={addProgress} style={{ padding: '6px 14px', borderRadius: '8px', background: '#1D9E75', color: '#fff', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>追加</button>
              </div>
            </div>
          )}

          {progress.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#a0a09c', fontSize: '13px' }}>まだ進捗はありません</div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '20px' }}>
              <div style={{ position: 'absolute', left: '6px', top: 0, bottom: 0, width: '2px', background: '#E1F5EE' }} />
              {progress.map((p, i) => (
                <div key={p.id} style={{ position: 'relative', marginBottom: '16px' }}>
                  <div style={{ position: 'absolute', left: '-17px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75', border: '2px solid #fff' }} />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '3px' }}>
                    <span style={{ fontSize: '10px', background: '#E1F5EE', color: '#0d6e50', padding: '2px 7px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.stage}</span>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{p.title}</div>
                  </div>
                  {p.content && <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.6', marginBottom: '3px' }}>{p.content}</div>}
                  <div style={{ fontSize: '11px', color: '#a0a09c' }}>{formatDate(p.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ピッチデック */}
        {pitchDecks.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '12px' }}>📊 ピッチデック</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {pitchDecks.map(deck => (
                <a key={deck.id} href={deck.file_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#f5f4f0', borderRadius: '12px', overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.08)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    {deck.thumbnail_url ? (
                      <img src={deck.thumbnail_url} alt={deck.title} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '32px' }}>{deck.file_type === 'pdf' ? '📄' : '📊'}</span>
                        <span style={{ fontSize: '10px', color: '#a0a09c', textTransform: 'uppercase', fontWeight: '600' }}>{deck.file_type}</span>
                      </div>
                    )}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.title}</div>
                      {deck.description && <div style={{ fontSize: '11px', color: '#6b6b67', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.description}</div>}
                      <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600', marginTop: '4px' }}>開いて見る →</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ピッチデック（あるときのみ表示） */}
        {pitchDecks.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '12px' }}>📊 ピッチデック</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {pitchDecks.map(deck => (
                <a key={deck.id} href={deck.file_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#f5f4f0', borderRadius: '12px', overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.08)' }}>
                    {deck.thumbnail_url ? (
                      <img src={deck.thumbnail_url} alt={deck.title} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '32px' }}>{deck.file_type === 'pdf' ? '📄' : '📊'}</span>
                        <span style={{ fontSize: '10px', color: '#a0a09c', textTransform: 'uppercase', fontWeight: '600' }}>{deck.file_type}</span>
                      </div>
                    )}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.title}</div>
                      <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600' }}>開いて見る →</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* コメント */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '12px' }}>💬 コメント・フィードバック</div>

          {user ? (
            <div style={{ marginBottom: '16px' }}>
              <textarea value={commentContent} onChange={e => setCommentContent(e.target.value)} placeholder={userProfile?.role === 'mentor' ? 'メンターとしてフィードバックを送る...' : 'コメントを入力...'} rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '8px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {userProfile?.role === 'mentor' && (
                  <span style={{ fontSize: '11px', background: '#fdecd4', color: '#8a4f0a', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>🎓 メンターとして投稿</span>
                )}
                <button onClick={postComment} disabled={postingComment || !commentContent.trim()} style={{ marginLeft: 'auto', padding: '7px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer', opacity: postingComment ? 0.7 : 1 }}>
                  {postingComment ? '投稿中...' : '投稿する'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '6px' }}>コメントするにはログインが必要です</div>
              <Link href="/login" style={{ fontSize: '13px', color: '#1D9E75', fontWeight: '600', textDecoration: 'none' }}>ログイン・登録 →</Link>
            </div>
          )}

          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#a0a09c', fontSize: '13px' }}>まだコメントはありません</div>
          ) : comments.map(c => {
            const cName = c.profiles?.full_name || c.profiles?.username || '名無し'
            return (
              <div key={c.id} style={{ padding: '12px', borderRadius: '12px', background: c.is_mentor ? '#fff8f0' : '#f5f4f0', marginBottom: '8px', border: c.is_mentor ? '1px solid #fdecd4' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
                      {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : cName[0]}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a18' }}>{cName}</span>
                    {c.is_mentor && <span style={{ fontSize: '10px', background: '#fdecd4', color: '#8a4f0a', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>🎓 メンター</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#a0a09c' }}>{formatDate(c.created_at)}</span>
                    {user?.id === c.user_id && (
                      <button onClick={() => deleteComment(c.id)} style={{ fontSize: '11px', color: '#c04020', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>削除</button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#1a1a18', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{c.content}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 閲覧ログモーダル */}
      {showViews && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}
          onClick={e => e.target === e.currentTarget && setShowViews(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18' }}>👁 閲覧ログ</div>
              <button onClick={() => setShowViews(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b6b67' }}>✕</button>
            </div>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '12px' }}>{views.length}人がこのアイデアを閲覧しました</div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {views.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#a0a09c' }}>まだ閲覧者がいません</div>
              ) : views.map(v => {
                const vProfile = v.profiles
                const vName = vProfile?.is_company ? vProfile.company_name : vProfile?.full_name || vProfile?.username || '名無しユーザー'
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: vProfile?.is_company ? '#1a3a5c' : '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: vProfile?.is_company ? '#fff' : '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
                      {vProfile?.avatar_url ? <img src={vProfile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : vProfile?.is_company ? '🏢' : vName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{vName}</div>
                      <div style={{ fontSize: '11px', color: '#a0a09c' }}>{formatDate(v.created_at)}</div>
                    </div>
                    {vProfile?.is_company && <span style={{ fontSize: '10px', background: '#eef2f7', color: '#1a3a5c', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>法人</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 通報モーダル */}
      {showReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}
          onClick={e => e.target === e.currentTarget && setShowReport(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '1rem' }}>🚩 投稿を通報する</div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '8px' }}>通報理由 *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['アイデアの盗用・コピー', 'スパム・宣伝', '不適切なコンテンツ', '誤情報・虚偽の内容', 'その他'].map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#1a1a18' }}>
                    <input type="radio" name="reason" value={r} checked={reportReason === r} onChange={() => setReportReason(r)} />{r}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>詳細（任意）</label>
              <textarea value={reportDetail} onChange={e => setReportDetail(e.target.value)} placeholder="具体的な状況を記載してください" rows={3}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowReport(false)} style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: 'none', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={submitReport} disabled={reporting} style={{ padding: '8px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#c04020', color: '#fff', border: 'none', cursor: 'pointer', opacity: reporting ? 0.7 : 1 }}>
                {reporting ? '送信中...' : '通報する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}