 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../../components/Navbar'
import AdvisorNavbar from '../../../../components/AdvisorNavbar'
import Footer from '../../../../components/Footer'

export default function ArticleDetailPage() {
  const [user, setUser] = useState(null)
  const [isAdvisor, setIsAdvisor] = useState(false)
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConsult, setShowConsult] = useState(false)
  const [consultForm, setConsultForm] = useState({ title: '', content: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('company_type').eq('id', user.id).single()
      setIsAdvisor(prof?.company_type === 'アドバイザー')
    }
    const { data } = await supabase.from('advisor_articles')
      .select('*, profiles!author_id(id, full_name, company_name, avatar_url, advisor_role, advisor_specialty, bio, is_verified)')
      .eq('id', params.id).single()
    if (!data) { router.push('/advisor/articles'); return }
    setArticle(data)
    setLoading(false)
  }

  async function submitConsultation() {
    if (!consultForm.title.trim() || !consultForm.content.trim()) { alert('すべて入力してください'); return }
    if (!user) { router.push('/login'); return }
    setSending(true)
    await supabase.from('consultation_requests').insert({
      advisor_id: article.author_id,
      user_id: user.id,
      title: consultForm.title,
      content: consultForm.content,
      status: 'pending'
    })
    await supabase.from('notifications').insert({
      user_id: article.author_id, from_id: user.id, type: 'message', idea_id: article.id
    })
    setSending(false)
    setSent(true)
    setTimeout(() => { setShowConsult(false); setSent(false) }, 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  const author = article.profiles
  const authorName = author?.full_name || author?.company_name || '名無し'
  const isOwner = user?.id === article.author_id

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      {isAdvisor ? <AdvisorNavbar /> : <Navbar />}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        <div style={{ marginBottom: '1rem' }}>
          <Link href="/advisor/articles" style={{ fontSize: '13px', color: '#7F77DD', textDecoration: 'none', fontWeight: '600' }}>← 記事一覧に戻る</Link>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '2rem', marginBottom: '12px' }}>
          {article.category && (
            <span style={{ fontSize: '11px', background: '#EEEDFE', color: '#534AB7', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', display: 'inline-block', marginBottom: '12px' }}>{article.category}</span>
          )}
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#1a1a18', lineHeight: '1.4', marginBottom: '1rem' }}>{article.title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '1.25rem', borderBottom: '0.5px solid rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
            <div onClick={() => router.push(`/profile/${author?.id}`)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#534AB7', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
              {author?.avatar_url ? <img src={author.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorName[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', cursor: 'pointer' }} onClick={() => router.push(`/profile/${author?.id}`)}>{authorName}</span>
                {author?.is_verified && <span style={{ fontSize: '10px' }}>✅</span>}
              </div>
              <div style={{ fontSize: '11px', color: '#a0a09c' }}>{author?.advisor_role} · {new Date(article.created_at).toLocaleDateString('ja-JP')}</div>
            </div>
          </div>

          <div style={{ fontSize: '15px', color: '#1a1a18', lineHeight: '2', whiteSpace: 'pre-wrap' }}>{article.content}</div>
        </div>

        {/* 著者プロフィール */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '12px' }}>✍️ この記事を書いたアドバイザー</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div onClick={() => router.push(`/profile/${author?.id}`)} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#534AB7', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
              {author?.avatar_url ? <img src={author.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorName[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '2px' }}>{authorName}</div>
              <div style={{ fontSize: '12px', color: '#7F77DD', marginBottom: '6px' }}>{author?.advisor_role} · {author?.advisor_specialty}</div>
              {author?.bio && <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.7', marginBottom: '10px' }}>{author.bio}</div>}
              {!isOwner && user && (
                <button onClick={() => setShowConsult(true)} style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: '#2d1f5e', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  💬 このアドバイザーに相談する
                </button>
              )}
              {!user && (
                <Link href="/login" style={{ display: 'inline-block', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: '#2d1f5e', color: '#fff', textDecoration: 'none' }}>
                  ログインして相談する
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 相談フォーム */}
        {showConsult && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1.5px solid #2d1f5e', padding: '1.5rem', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '1rem' }}>💬 {authorName}さんに相談する</div>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#0d6e50', fontWeight: '600' }}>✅ 相談を送信しました！</div>
            ) : (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>相談タイトル</label>
                  <input value={consultForm.title} onChange={e => setConsultForm({ ...consultForm, title: e.target.value })}
                    placeholder="例：スタートアップの資金調達について" style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>相談内容</label>
                  <textarea value={consultForm.content} onChange={e => setConsultForm({ ...consultForm, content: e.target.value })}
                    placeholder="具体的な状況や質問を記入してください" rows={5}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowConsult(false)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: '#fff', cursor: 'pointer' }}>キャンセル</button>
                  <button onClick={submitConsultation} disabled={sending} style={{ padding: '9px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#2d1f5e', color: '#fff', border: 'none', cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>{sending ? '送信中...' : '相談を送る'}</button>
                </div>
              </>
            )}
          </div>
        )}

        {isOwner && (
          <div style={{ textAlign: 'right' }}>
            <button onClick={async () => {
              if (!confirm('この記事を削除しますか？')) return
              await supabase.from('advisor_articles').delete().eq('id', article.id)
              router.push('/advisor/articles')
            }} style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', color: '#c04020', border: '1px solid #c04020', background: '#fff', cursor: 'pointer' }}>記事を削除</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
