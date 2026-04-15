'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/Navbar'

export default function IdeaDetailPage() {
  const [idea, setIdea] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [showMessage, setShowMessage] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [reporting, setReporting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    getUser()
    getIdea()
  }, [])

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data } = await supabase.from('likes')
        .select('id').eq('user_id', user.id).eq('idea_id', params.id).single()
      setLiked(!!data)
    }
  }

  async function getIdea() {
    const { data } = await supabase
      .from('ideas')
      .select('*, profiles(id, username, full_name, bio, is_company, company_name, avatar_url)')
      .eq('id', params.id)
      .single()
    setIdea(data)
    const { count } = await supabase.from('likes')
      .select('*', { count: 'exact', head: true }).eq('idea_id', params.id)
    setLikeCount(count || 0)
    setLoading(false)
  }

  async function submitReport() {
    if (!reportReason) { alert('理由を選択してください'); return }
    setReporting(true)
    await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: 'idea',
      target_id: params.id,
      reason: reportReason,
      detail: reportDetail
    })
    setReporting(false)
    setShowReport(false)
    setReportReason('')
    setReportDetail('')
    alert('通報を受け付けました。確認後に対応します。')
  }

  async function toggleLike() {
    if (!user) { router.push('/login'); return }
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('idea_id', params.id)
      setLiked(false)
      setLikeCount(prev => prev - 1)
    } else {
      await supabase.from('likes').insert({ user_id: user.id, idea_id: params.id })
      setLiked(true)
      setLikeCount(prev => prev + 1)
      if (user.id !== idea.profiles.id) {
        await supabase.from('notifications').insert({
          user_id: idea.profiles.id,
          from_id: user.id,
          type: 'like',
          idea_id: params.id
        })
      }
    }
  }

  async function sendMessage() {
    if (!messageContent.trim()) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: idea.profiles.id,
      idea_id: params.id,
      content: messageContent.trim()
    })
    if (error) { alert('エラー: ' + error.message); setSending(false); return }
    setSending(false)
    setSent(true)
    setMessageContent('')
    setTimeout(() => { setShowMessage(false); setSent(false) }, 2000)
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

  const sec = (num, label, value) => {
    if (!value) return null
    if (!user) {
      return (
        <div style={{ padding: '1.1rem 0', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1D9E75', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18' }}>{label}</div>
          </div>
          <div style={{ paddingLeft: '30px', background: '#f5f4f0', borderRadius: '8px', padding: '10px 12px', filter: num > 1 ? 'blur(4px)' : 'none', userSelect: num > 1 ? 'none' : 'auto' }}>
            <div style={{ fontSize: '14px', color: '#6b6b67', lineHeight: '1.9' }}>{num === 1 ? value : '会員登録後に閲覧できます'}</div>
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

        {/* ヘッダー */}
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
              <div style={{ fontSize: '12px', color: '#6b6b67', marginTop: '2px' }}>
                投稿日時：{new Date(idea.created_at).toLocaleString('ja-JP')} ／ ID：{idea.id}
              </div>
            </div>
            <button onClick={() => {
              const text = `IdeaVault タイムスタンプ証明\nタイトル: ${idea.title}\n投稿日時: ${new Date(idea.created_at).toLocaleString('ja-JP')}\nID: ${idea.id}\nURL: ${window.location.href}`
              navigator.clipboard.writeText(text)
              alert('タイムスタンプ情報をコピーしました')
            }} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', color: '#6b6b67', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              コピー
            </button>
          </div>

          {/* 投稿者 */}
          <div onClick={() => router.push(`/profile/${profile?.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden' }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18' }}>{name}</div>
              {profile?.bio && <div style={{ fontSize: '12px', color: '#6b6b67' }}>{profile.bio}</div>}
            </div>
            {idea.category && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', background: '#f0eeea', padding: '3px 9px', borderRadius: '20px', color: '#6b6b67', flexShrink: 0 }}>{idea.category}</span>
            )}
          </div>

          {/* 未ログイン時のCTA */}
          {!user && (
            <div style={{ background: '#f0eeea', borderRadius: '12px', padding: '14px 16px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: '#6b6b67' }}>詳細・収益モデルは会員登録後に閲覧できます</div>
              <Link href="/login" style={{ background: '#1D9E75', color: '#fff', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap' }}>無料で登録</Link>
            </div>
          )}

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={toggleLike} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              border: `1px solid ${liked ? '#e74c3c' : 'rgba(0,0,0,0.15)'}`,
              background: liked ? '#fff0f0' : '#fff',
              color: liked ? '#e74c3c' : '#6b6b67',
              cursor: 'pointer', transition: 'all 0.15s'
            }}>{liked ? '❤️' : '🤍'} {likeCount}</button>

            <button onClick={() => {
              const url = window.location.href
              const text = `${idea.title} - IdeaVault`
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
            }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(0,0,0,0.15)', background: '#fff', color: '#1a1a18', cursor: 'pointer' }}>𝕏 シェア</button>

            <button onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('URLをコピーしました！')
            }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(0,0,0,0.15)', background: '#fff', color: '#1a1a18', cursor: 'pointer' }}>🔗 URLをコピー</button>

            {user && !isOwner && (
              <button onClick={() => setShowMessage(true)} style={{ background: '#1D9E75', color: '#fff', padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>✉️ メッセージを送る</button>
            )}

            {user && !isOwner && (
              <button onClick={() => setShowReport(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', border: '1px solid rgba(0,0,0,0.15)', background: '#fff', color: '#c04020', cursor: 'pointer' }}>🚩 通報</button>
            )}

            {isOwner && (
              <>
                <div onClick={() => router.push(`/ideas/${idea.id}/edit`)} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', cursor: 'pointer' }}>編集</div>
                <button onClick={handleDelete} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#c04020', background: 'none', cursor: 'pointer' }}>削除</button>
              </>
            )}
          </div>
        </div>

        {/* メッセージ送信パネル */}
        {showMessage && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #1D9E75', padding: '1.25rem', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px' }}>{name}さんにメッセージを送る</div>
            {sent ? (
              <div style={{ background: '#d8f2ea', color: '#0d6e50', padding: '12px', borderRadius: '10px', fontSize: '14px', textAlign: 'center', fontWeight: '600' }}>✓ 送信しました！</div>
            ) : (
              <>
                <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)}
                  placeholder={`${name}さんへのメッセージを入力してください...`} rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '10px' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={() => { setShowMessage(false); setMessageContent('') }} style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: 'none', cursor: 'pointer' }}>キャンセル</button>
                  <button onClick={sendMessage} disabled={sending || !messageContent.trim()} style={{ padding: '8px 22px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
                    {sending ? '送信中...' : '送信する'}
                  </button>
                </div>
              </>
            )}
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
                      <input type="radio" name="reason" value={r} checked={reportReason === r} onChange={() => setReportReason(r)} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>詳細（任意）</label>
                <textarea value={reportDetail} onChange={e => setReportDetail(e.target.value)}
                  placeholder="具体的な状況を記載してください" rows={3}
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

        {/* 詳細セクション */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '0.5rem 1.5rem 1rem' }}>
          {!user && (
            <div style={{ padding: '1.25rem 0', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6b6b67', marginBottom: '10px' }}>詳細内容は会員登録後に閲覧できます</div>
              <Link href="/login" style={{ background: '#1D9E75', color: '#fff', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>無料で登録する</Link>
            </div>
          )}
          {sec(1, 'コンセプト', idea.concept)}
          {sec(2, '主な機能・サービス', idea.features)}
          {sec(3, 'ターゲット', idea.target)}
          {sec(4, '収益モデル', idea.revenue)}
          {sec(5, '差別化の本質', idea.edge)}
          {sec(6, '立ち上げ戦略', idea.launch)}
          {sec(7, 'メモ＆補足', idea.memo)}
        </div>
      </div>
    </div>
  )
}