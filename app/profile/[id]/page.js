 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followCounts, setFollowCounts] = useState({ following: 0, followers: 0 })
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    await getProfile()
    await getIdeas()
    if (user) await checkFollowing(user.id)
    await getFollowCounts()
    setLoading(false)
  }

  async function getProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', params.id).single()
    setProfile(data)
  }

  async function getIdeas() {
    const { data } = await supabase
      .from('ideas').select('*').eq('user_id', params.id)
      .order('created_at', { ascending: false })
    setIdeas(data || [])
  }

  async function checkFollowing(userId) {
    const { data } = await supabase.from('follows')
      .select('id').eq('follower_id', userId).eq('following_id', params.id).single()
    setFollowing(!!data)
  }

  async function getFollowCounts() {
    const [{ count: followingCount }, { count: followersCount }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', params.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', params.id)
    ])
    setFollowCounts({ following: followingCount || 0, followers: followersCount || 0 })
  }

  async function toggleFollow() {
    if (!user) { router.push('/login'); return }
    if (following) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', params.id)
      setFollowing(false)
      setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }))
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: params.id })
      setFollowing(true)
      setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }))
    }
  }

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}年${d.getMonth() + 1}月`
  }

  const BADGE = {
    'アイデア':  { bg: '#deeefb', color: '#1255a0' },
    '検討中':    { bg: '#fdecd4', color: '#8a4f0a' },
    '進行中':    { bg: '#d8f2ea', color: '#0d6e50' },
    '完成':      { bg: '#e4f2d8', color: '#376b10' },
    '一時停止':  { bg: '#eeecea', color: '#5a5a56' },
  }

  const name = profile?.is_company ? profile.company_name : profile?.full_name || profile?.username || '名無し'
  const isOwnProfile = user?.id === params.id

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  if (!profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>ユーザーが見つかりませんでした</div>
    </div>
  )

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

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', marginBottom: '12px', overflow: 'hidden' }}>

          {/* バナー */}
          <div style={{
            height: '120px',
            background: profile.banner_url ? `url(${profile.banner_url}) center/cover` : '#E1F5EE'
          }} />

          {/* アバター＋ボタン行 */}
          <div style={{ padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-36px', marginBottom: '12px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              border: '3px solid #fff', overflow: 'hidden',
              background: '#E1F5EE', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '28px', fontWeight: '700', color: '#0F6E56' }}>{name[0]}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {isOwnProfile ? (
                <Link href="/mypage" style={{
                  padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                  border: '1px solid rgba(0,0,0,0.2)', color: '#1a1a18', textDecoration: 'none'
                }}>プロフィールを編集</Link>
              ) : (
                <>
                  {user && (
                    <Link href={`/messages?to=${params.id}`} style={{
                      padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                      border: '1px solid rgba(0,0,0,0.2)', color: '#1a1a18', textDecoration: 'none'
                    }}>メッセージ</Link>
                  )}
                  <button onClick={toggleFollow} style={{
                    padding: '7px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                    border: 'none', cursor: 'pointer',
                    background: following ? '#fff' : '#1a1a18',
                    color: following ? '#1a1a18' : '#fff',
                    outline: following ? '1px solid rgba(0,0,0,0.2)' : 'none'
                  }}>
                    {following ? 'フォロー中' : 'フォロー'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* プロフィール情報 */}
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18', marginBottom: '2px' }}>{name}</div>
            {profile.username && (
              <div style={{ fontSize: '14px', color: '#6b6b67', marginBottom: '10px' }}>@{profile.username}</div>
            )}
            {profile.bio && (
              <div style={{ fontSize: '14px', color: '#1a1a18', lineHeight: '1.7', marginBottom: '12px' }}>{profile.bio}</div>
            )}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {profile.location && (
                <span style={{ fontSize: '13px', color: '#6b6b67' }}>📍 {profile.location}</span>
              )}
              {profile.created_at && (
                <span style={{ fontSize: '13px', color: '#6b6b67' }}>🗓 {formatDate(profile.created_at)}に登録</span>
              )}
            </div>
            {(profile.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {profile.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '12px', background: '#E1F5EE', color: '#0d6e50', padding: '3px 10px', borderRadius: '20px' }}>{tag}</span>
                ))}
              </div>
            )}

            {/* フォロー数・フォロワー数 */}
            <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', paddingTop: '12px', display: 'flex', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{followCounts.following}</span>
                <span style={{ fontSize: '13px', color: '#6b6b67', marginLeft: '4px' }}>フォロー中</span>
              </div>
              <div>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{followCounts.followers}</span>
                <span style={{ fontSize: '13px', color: '#6b6b67', marginLeft: '4px' }}>フォロワー</span>
              </div>
              <div>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{ideas.length}</span>
                <span style={{ fontSize: '13px', color: '#6b6b67', marginLeft: '4px' }}>企画</span>
              </div>
            </div>
          </div>
        </div>

        {/* 投稿した企画 */}
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px' }}>投稿した企画</div>
        {ideas.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '3rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>
            まだ投稿がありません
          </div>
        ) : (
          ideas.map(idea => {
            const badge = BADGE[idea.status] || BADGE['アイデア']
            return (
              <Link key={idea.id} href={`/ideas/${idea.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)',
                  padding: '1.1rem 1.3rem', marginBottom: '10px'
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{idea.title}</div>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, background: badge.bg, color: badge.color }}>{idea.status}</span>
                  </div>
                  {idea.concept && (
                    <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{idea.concept}</div>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
