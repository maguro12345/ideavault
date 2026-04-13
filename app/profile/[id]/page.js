 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/Navbar'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [followState, setFollowState] = useState('none')
  const [followCounts, setFollowCounts] = useState({ following: 0, followers: 0 })
  const [requests, setRequests] = useState([])
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    await getProfile()
    await getFollowCounts()
    if (user) {
      await checkFollowState(user.id)
      if (user.id === params.id) await getFollowRequests(user.id)
    }
    setLoading(false)
  }

  async function getProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', params.id).single()
    setProfile(data)
    if (data) await getIdeas(data)
  }

  async function getIdeas(p) {
    const { data: { user } } = await supabase.auth.getUser()
    const isOwn = user?.id === params.id
    const isFollowing = async () => {
      if (!user) return false
      const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', params.id).single()
      return !!data
    }
    if (p.is_private && !isOwn && !(await isFollowing())) {
      setIdeas([])
      return
    }
    const { data } = await supabase.from('ideas').select('*').eq('user_id', params.id).order('created_at', { ascending: false })
    setIdeas(data || [])
  }

  async function getFollowCounts() {
    const [{ count: following }, { count: followers }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', params.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', params.id)
    ])
    setFollowCounts({ following: following || 0, followers: followers || 0 })
  }

  async function checkFollowState(userId) {
    const { data: follow } = await supabase.from('follows')
      .select('id').eq('follower_id', userId).eq('following_id', params.id).single()
    if (follow) { setFollowState('following'); return }

    const { data: req } = await supabase.from('follow_requests')
      .select('id').eq('requester_id', userId).eq('target_id', params.id).single()
    if (req) { setFollowState('requested'); return }

    setFollowState('none')
  }

  async function getFollowRequests(userId) {
    const { data } = await supabase
      .from('follow_requests')
      .select('*, profiles!requester_id(id, username, full_name, avatar_url)')
      .eq('target_id', userId)
      .eq('status', 'pending')
    setRequests(data || [])
  }

  async function toggleFollow() {
    if (!user) { router.push('/login'); return }
    if (followState === 'following') {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', params.id)
      setFollowState('none')
      setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }))
    } else if (followState === 'requested') {
      await supabase.from('follow_requests').delete().eq('requester_id', user.id).eq('target_id', params.id)
      setFollowState('none')
    } else {
      if (profile.is_private) {
        await supabase.from('follow_requests').insert({ requester_id: user.id, target_id: params.id })
        setFollowState('requested')
        await supabase.from('notifications').insert({
          user_id: params.id,
          from_id: user.id,
          type: 'follow_request'
        })
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: params.id })
        setFollowState('following')
        setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }))
        await supabase.from('notifications').insert({
          user_id: params.id,
          from_id: user.id,
          type: 'follow'
        })
      }
    }
  }

  async function approveRequest(requestId, requesterId) {
    await supabase.from('follows').insert({ follower_id: requesterId, following_id: user.id })
    await supabase.from('follow_requests').delete().eq('id', requestId)
    setRequests(prev => prev.filter(r => r.id !== requestId))
    setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }))
  }

  async function blockUser() {
    if (!user) return
    if (!confirm('このユーザーをブロックしますか？')) return
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: params.id })
    router.push('/')
  }

  async function muteUser() {
    if (!user) return
    await supabase.from('mutes').insert({ muter_id: user.id, muted_id: params.id })
    alert('ミュートしました')
  }

  async function rejectRequest(requestId) {
    await supabase.from('follow_requests').delete().eq('id', requestId)
    setRequests(prev => prev.filter(r => r.id !== requestId))
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
  const isPrivateAndNotFollowing = profile?.is_private && !isOwnProfile && followState !== 'following'

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
      <Navbar />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* フォローリクエスト（自分のプロフィールのみ） */}
        {isOwnProfile && requests.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #1D9E75', padding: '1.25rem', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '12px' }}>
              🔔 フォローリクエスト（{requests.length}件）
            </div>
            {requests.map(req => {
              const rName = req.profiles?.full_name || req.profiles?.username || '名無し'
              return (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#E1F5EE', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#0F6E56',
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {req.profiles?.avatar_url
                      ? <img src={req.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : rName[0]
                    }
                  </div>
                  <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{rName}</div>
                  <button onClick={() => approveRequest(req.id, req.requester_id)} style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer'
                  }}>承認</button>
                  <button onClick={() => rejectRequest(req.id)} style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: 'none', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', cursor: 'pointer'
                  }}>拒否</button>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', marginBottom: '12px', overflow: 'hidden' }}>
          {/* バナー */}
          <div style={{
            height: '120px',
            background: profile.banner_url ? `url(${profile.banner_url}) center/cover` : '#E1F5EE'
          }} />

          {/* アバター＋ボタン */}
          <div style={{ padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-36px', marginBottom: '12px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              border: '3px solid #fff', overflow: 'hidden',
              background: '#E1F5EE', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '28px', fontWeight: '700', color: '#0F6E56' }}>{name[0]}</span>
              }
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
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => document.getElementById('more-menu').style.display === 'none' ? document.getElementById('more-menu').style.display = 'block' : document.getElementById('more-menu').style.display = 'none'} style={{
                      padding: '7px 12px', borderRadius: '20px', fontSize: '16px',
                      border: '1px solid rgba(0,0,0,0.2)', background: '#fff', cursor: 'pointer'
                    }}>•••</button>
                    <div id="more-menu" style={{ display: 'none', position: 'absolute', right: 0, top: '36px', background: '#fff', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '140px', overflow: 'hidden' }}>
                      <div onClick={muteUser} style={{ padding: '12px 16px', fontSize: '13px', cursor: 'pointer', color: '#1a1a18', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >🔇 ミュートする</div>
                      <div onClick={blockUser} style={{ padding: '12px 16px', fontSize: '13px', cursor: 'pointer', color: '#c04020' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >🚫 ブロックする</div>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => document.getElementById('more-menu').style.display === 'none' ? document.getElementById('more-menu').style.display = 'block' : document.getElementById('more-menu').style.display = 'none'} style={{
                      padding: '7px 12px', borderRadius: '20px', fontSize: '16px',
                      border: '1px solid rgba(0,0,0,0.2)', background: '#fff', cursor: 'pointer'
                    }}>•••</button>
                    <div id="more-menu" style={{ display: 'none', position: 'absolute', right: 0, top: '36px', background: '#fff', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '140px', overflow: 'hidden' }}>
                      <div onClick={muteUser} style={{ padding: '12px 16px', fontSize: '13px', cursor: 'pointer', color: '#1a1a18', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >🔇 ミュートする</div>
                      <div onClick={blockUser} style={{ padding: '12px 16px', fontSize: '13px', cursor: 'pointer', color: '#c04020' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >🚫 ブロックする</div>
                    </div>
                  </div>
                  <button onClick={toggleFollow} style={{
                    padding: '7px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                    border: followState === 'none' ? 'none' : '1px solid rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    background: followState === 'none' ? '#1a1a18' : '#fff',
                    color: followState === 'none' ? '#fff' : '#1a1a18',
                  }}>
                    {followState === 'following' ? 'フォロー中' : followState === 'requested' ? 'リクエスト済み' : 'フォロー'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* プロフィール情報 */}
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18' }}>{name}</div>
              {profile.is_private && <span style={{ fontSize: '16px' }}>🔒</span>}
            </div>
            {profile.username && <div style={{ fontSize: '14px', color: '#6b6b67', marginBottom: '10px' }}>@{profile.username}</div>}

            {isPrivateAndNotFollowing ? (
              <div style={{ background: '#f0eeea', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginTop: '1rem' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '4px' }}>このアカウントは非公開です</div>
                <div style={{ fontSize: '13px', color: '#6b6b67' }}>フォローしてコンテンツを見る</div>
              </div>
            ) : (
              <>
                {profile.bio && <div style={{ fontSize: '14px', color: '#1a1a18', lineHeight: '1.7', marginBottom: '12px' }}>{profile.bio}</div>}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {profile.location && <span style={{ fontSize: '13px', color: '#6b6b67' }}>📍 {profile.location}</span>}
                  {profile.created_at && <span style={{ fontSize: '13px', color: '#6b6b67' }}>🗓 {formatDate(profile.created_at)}に登録</span>}
                </div>
                {(profile.tags || []).length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {profile.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '12px', background: '#E1F5EE', color: '#0d6e50', padding: '3px 10px', borderRadius: '20px' }}>{tag}</span>
                    ))}
                  </div>
                )}
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
              </>
            )}
          </div>
        </div>

        {/* 投稿した企画 */}
        {!isPrivateAndNotFollowing && (
          <>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px' }}>投稿した企画</div>
            {ideas.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '3rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>
                まだ投稿がありません
              </div>
            ) : (
              ideas.map(idea => {
                const badge = BADGE[idea.status] || BADGE['アイデア']
                return (
                  <div key={idea.id} onClick={() => router.push(`/ideas/${idea.id}`)} style={{
                    background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)',
                    padding: '1.1rem 1.3rem', marginBottom: '10px', cursor: 'pointer'
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
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}