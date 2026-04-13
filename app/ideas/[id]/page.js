 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function IdeaDetailPage() {
  const [idea, setIdea] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
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
  }

  async function getIdea() {
    const { data } = await supabase
      .from('ideas')
      .select('*, profiles(id, username, full_name, bio, is_company, company_name)')
      .eq('id', params.id)
      .single()
    setIdea(data)
    setLoading(false)
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

  const sec = (num, label, value) => value ? (
    <div style={{ padding: '1.1rem 0', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '50%',
          background: '#1D9E75', color: '#fff', fontSize: '11px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>{num}</div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18' }}>{label}</div>
      </div>
      <div style={{ fontSize: '14px', color: '#6b6b67', lineHeight: '1.9', whiteSpace: 'pre-wrap', paddingLeft: '30px' }}>{value}</div>
    </div>
  ) : null

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

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* ヘッダー */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a18', letterSpacing: '-0.5px', lineHeight: '1.3' }}>{idea.title}</h1>
            <span style={{
              fontSize: '11px', padding: '4px 12px', borderRadius: '20px',
              fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0,
              background: badge.bg, color: badge.color
            }}>{idea.status}</span>
          </div>

          {/* 投稿者 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: '#E1F5EE', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#0F6E56'
            }}>{name[0]}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{name}</div>
              {profile?.bio && <div style={{ fontSize: '12px', color: '#6b6b67' }}>{profile.bio}</div>}
            </div>
            {idea.category && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', background: '#f0eeea', padding: '3px 9px', borderRadius: '20px', color: '#6b6b67' }}>{idea.category}</span>
            )}
          </div>

          {/* アクション */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {user && !isOwner && (
              <Link href={`/messages?to=${profile?.id}&idea=${idea.id}`} style={{
                background: '#1D9E75', color: '#fff', padding: '8px 20px',
                borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none'
              }}>メッセージを送る</Link>
            )}
            {isOwner && (
              <>
                <Link href={`/ideas/${idea.id}/edit`} style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                  border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', textDecoration: 'none'
                }}>編集</Link>
                <button onClick={handleDelete} style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                  border: '0.5px solid rgba(0,0,0,0.15)', color: '#c04020',
                  background: 'none', cursor: 'pointer'
                }}>削除</button>
              </>
            )}
          </div>
        </div>

        {/* 詳細セクション */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '0.5rem 1.5rem 1rem' }}>
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
