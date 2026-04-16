'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/Navbar'

export default function MyPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ideas, setIdeas] = useState([])
  const [pitchDecks, setPitchDecks] = useState([])
  const [tab, setTab] = useState('ideas')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [cropModal, setCropModal] = useState(null) // { file, type: 'avatar'|'banner' }
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [followCounts, setFollowCounts] = useState({ following: 0, followers: 0 })
  const [form, setForm] = useState({
    full_name: '', username: '', bio: '', location: '',
    tags: '', is_company: false, company_name: '', is_private: false
  })
  const fileInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await getProfile(user.id)
    await getIdeas(user.id)
    await getPitchDecks(user.id)
    await getFollowCounts(user.id)
    setLoading(false)
  }

  async function getProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      setProfile(data)
      setForm({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
        location: data.location || '',
        tags: (data.tags || []).join(', '),
        is_company: data.is_company || false,
        company_name: data.company_name || '',
        is_private: data.is_private || false
      })
    }
  }

  async function getIdeas(userId) {
    const { data } = await supabase.from('ideas').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setIdeas(data || [])
  }

  async function getPitchDecks(userId) {
    const { data } = await supabase.from('pitch_decks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setPitchDecks(data || [])
  }

  async function getFollowCounts(userId) {
    const [{ count: following }, { count: followers }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId)
    ])
    setFollowCounts({ following: following || 0, followers: followers || 0 })
  }

  function openCrop(e, type) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setCropSrc(reader.result); setCropModal({ file, type }); setCrop({ x: 0, y: 0 }); setZoom(1) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onCropComplete = useCallback((_, pixels) => { setCroppedAreaPixels(pixels) }, [])

  async function getCroppedImg(src, pixels) {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src })
    const canvas = document.createElement('canvas')
    canvas.width = pixels.width; canvas.height = pixels.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, pixels.width, pixels.height)
    return new Promise(res => canvas.toBlob(blob => res(blob), 'image/jpeg', 0.95))
  }

  async function applyCrop() {
    if (!croppedAreaPixels || !cropModal) return
    const { type } = cropModal
    if (type === 'avatar') setAvatarUploading(true)
    else setBannerUploading(true)
    const blob = await getCroppedImg(cropSrc, croppedAreaPixels)
    const path = `${type}_${user.id}.jpg`
    await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const update = type === 'avatar' ? { avatar_url: publicUrl } : { banner_url: publicUrl }
    await supabase.from('profiles').update(update).eq('id', user.id)
    await getProfile(user.id)
    if (type === 'avatar') setAvatarUploading(false)
    else setBannerUploading(false)
    setCropModal(null); setCropSrc(null)
  }

  async function uploadAvatar(e) { openCrop(e, 'avatar') }
  async function uploadBanner(e) { openCrop(e, 'banner') }

  async function saveProfile() {
    setSaving(true)
    if (form.username) {
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', form.username).neq('id', user.id).single()
      if (existing) { alert('このユーザー名はすでに使われています'); setSaving(false); return }
    }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name,
      username: form.username,
      bio: form.bio,
      location: form.location,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      is_company: form.is_company,
      company_name: form.company_name,
      is_private: form.is_private
    })
    if (error) { alert('エラー: ' + error.message); setSaving(false); return }
    await getProfile(user.id)
    setEditing(false)
    setSaving(false)
  }

  async function deletePitchDeck(id) {
    if (!confirm('このピッチデックを削除しますか？')) return
    await supabase.from('pitch_decks').delete().eq('id', id)
    await getPitchDecks(user.id)
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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* プロフィールカード */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', marginBottom: '12px', overflow: 'hidden' }}>

          {/* バナー */}
          <div onClick={() => bannerInputRef.current?.click()} style={{
            height: '120px', cursor: 'pointer', position: 'relative',
            background: profile?.banner_url ? `url(${profile.banner_url}) center/cover` : '#E1F5EE',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {bannerUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: '13px' }}>アップロード中...</span>
              </div>
            )}
            {!profile?.banner_url && !bannerUploading && (
              <span style={{ fontSize: '13px', color: '#0F6E56', opacity: 0.6 }}>クリックしてバナー画像を設定</span>
            )}
            <div style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '20px' }}>📷 変更</div>
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={uploadBanner} style={{ display: 'none' }} />
          </div>

          {/* アバター＋ボタン行 */}
          <div style={{ padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-36px', marginBottom: '12px' }}>
            <div style={{ position: 'relative' }}>
              <div onClick={() => fileInputRef.current?.click()} style={{
                width: '72px', height: '72px', borderRadius: '50%', border: '3px solid #fff', overflow: 'hidden',
                background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative'
              }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '28px', fontWeight: '700', color: '#0F6E56' }}>{name[0]}</span>
                )}
                {avatarUploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    <span style={{ color: '#fff', fontSize: '10px' }}>...</span>
                  </div>
                )}
              </div>
              <div onClick={() => fileInputRef.current?.click()} style={{
                position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%',
                background: '#1D9E75', border: '2px solid #fff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', fontSize: '11px'
              }}>📷</div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/messages" style={{
                padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                border: '1px solid rgba(0,0,0,0.2)', color: '#1a1a18', textDecoration: 'none', display: 'inline-block'
              }}>メッセージ</Link>
              {!editing && (
                <button onClick={() => setEditing(true)} style={{
                  padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                  border: '1px solid rgba(0,0,0,0.2)', color: '#1a1a18', background: 'none', cursor: 'pointer'
                }}>プロフィールを編集</button>
              )}
            </div>
          </div>

          {/* プロフィール本文 */}
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            {!editing ? (
              <>
                {/* 名前＋認証バッジ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18' }}>{name}</div>
                  {profile?.is_verified && (
                    <span style={{ fontSize: '12px', background: '#d8f2ea', color: '#0d6e50', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      ✅ 認証済み法人
                    </span>
                  )}
                  {profile?.is_company && !profile?.is_verified && (
                    <span style={{ fontSize: '12px', background: '#eef2f7', color: '#1a3a5c', padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>
                      🏢 法人
                    </span>
                  )}
                  {profile?.is_private && (
                    <span style={{ fontSize: '12px', color: '#6b6b67' }}>🔒 鍵垢</span>
                  )}
                </div>
                {profile?.username && <div style={{ fontSize: '14px', color: '#6b6b67', marginBottom: '10px' }}>@{profile.username}</div>}
                {profile?.bio && <div style={{ fontSize: '14px', color: '#1a1a18', lineHeight: '1.7', marginBottom: '12px' }}>{profile.bio}</div>}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {profile?.location && <span style={{ fontSize: '13px', color: '#6b6b67' }}>📍 {profile.location}</span>}
                  {profile?.created_at && <span style={{ fontSize: '13px', color: '#6b6b67' }}>🗓 {formatDate(profile.created_at)}に登録</span>}
                </div>
                {(profile?.tags || []).length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {profile.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '12px', background: '#E1F5EE', color: '#0d6e50', padding: '3px 10px', borderRadius: '20px' }}>{tag}</span>
                    ))}
                  </div>
                )}

                {/* 認証済みの場合は法人番号も表示 */}
                {profile?.is_verified && profile?.corporate_number && (
                  <div style={{ background: '#f0faf6', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>🏛️</span>
                    <div>
                      <div style={{ fontSize: '11px', color: '#0d6e50', fontWeight: '700', marginBottom: '2px' }}>国税庁認証済み法人</div>
                      <div style={{ fontSize: '12px', color: '#6b6b67' }}>法人番号：{profile.corporate_number}</div>
                    </div>
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
            ) : (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b6b67', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_company} onChange={e => setForm({ ...form, is_company: e.target.checked })} />
                    企業・法人アカウント
                  </label>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b6b67', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_private} onChange={e => setForm({ ...form, is_private: e.target.checked })} />
                    🔒 鍵垢にする（フォロワーのみ企画を閲覧可能）
                  </label>
                </div>
                {form.is_company && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>会社名</label>
                    <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}
                      placeholder="例：株式会社〇〇"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                )}
                {[
                  { label: '氏名', key: 'full_name', placeholder: '例：田中 誠' },
                  { label: 'ユーザー名（@は不要）', key: 'username', placeholder: '例：tanaka_makoto' },
                  { label: '所在地（任意）', key: 'location', placeholder: '例：東京都' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>{label}</label>
                    <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>自己紹介</label>
                  <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                    placeholder="得意分野、目標、探しているパートナーなど" rows={3}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>タグ（カンマ区切り）</label>
                  <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                    placeholder="例：SaaS, AI, フードテック"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={() => setEditing(false)} style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '13px', border: '1px solid rgba(0,0,0,0.2)', color: '#1a1a18', background: 'none', cursor: 'pointer' }}>キャンセル</button>
                  <button onClick={saveProfile} disabled={saving} style={{ padding: '8px 22px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    {saving ? '保存中...' : '保存する'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(0,0,0,0.1)', marginBottom: '12px', background: '#fff', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
          {[
            { key: 'ideas', label: `企画 ${ideas.length}` },
            { key: 'pitch', label: `ピッチデック ${pitchDecks.length}` }
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '14px', fontSize: '14px', fontWeight: tab === t.key ? '700' : '400',
              color: tab === t.key ? '#1a1a18' : '#6b6b67',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid #1a1a18' : '2px solid transparent',
              transition: 'all 0.15s'
            }}>{t.label}</button>
          ))}
        </div>

        {/* 投稿ボタン */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          {tab === 'ideas' ? (
            <Link href="/ideas/create" style={{ background: '#1D9E75', color: '#fff', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>＋ 企画を投稿</Link>
          ) : (
            <Link href="/pitch/create" style={{ background: '#1D9E75', color: '#fff', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>＋ ピッチデックを投稿</Link>
          )}
        </div>

        {/* 企画一覧 */}
        {tab === 'ideas' && (
          ideas.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '3rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>まだ投稿がありません</div>
          ) : ideas.map(idea => {
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

        {/* ピッチデック一覧 */}
        {tab === 'pitch' && (
          pitchDecks.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '3rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>まだピッチデックがありません</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {pitchDecks.map(deck => (
                <div key={deck.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', overflow: 'hidden', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ height: '160px', background: '#f0eeea', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {deck.thumbnail_url ? (
                      <img src={deck.thumbnail_url} alt={deck.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>{deck.file_type === 'pdf' ? '📄' : '📊'}</div>
                        <div style={{ fontSize: '12px', color: '#a0a09c', textTransform: 'uppercase', fontWeight: '600' }}>{deck.file_type}</div>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: '600' }}>{deck.file_type}</div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '4px' }}>{deck.title}</div>
                    {deck.description && (
                      <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '10px' }}>{deck.description}</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <a href={deck.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '600', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>開いて見る →</a>
                      <button onClick={e => { e.stopPropagation(); deletePitchDeck(deck.id) }} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#c04020', cursor: 'pointer' }}>削除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    {/* クロップモーダル */}
      {cropModal && cropSrc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '500px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.1)', fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>
              {cropModal.type === 'avatar' ? 'アイコン' : 'バナー'}画像をトリミング
            </div>
            <div style={{ position: 'relative', width: '100%', height: '300px', background: '#000' }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropModal.type === 'avatar' ? 1 : 16 / 5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', color: '#6b6b67', flexShrink: 0 }}>ズーム</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: '12px', color: '#6b6b67', flexShrink: 0 }}>{zoom.toFixed(1)}x</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setCropModal(null); setCropSrc(null) }} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: '#fff', cursor: 'pointer' }}>キャンセル</button>
                <button onClick={applyCrop} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>適用する</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}