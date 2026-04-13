 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('account')
  const [blocks, setBlocks] = useState([])
  const [mutes, setMutes] = useState([])
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await getProfile(user.id)
    await getBlocks(user.id)
    await getMutes(user.id)
    setLoading(false)
  }

  async function getProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  async function getBlocks(userId) {
    const { data } = await supabase
      .from('blocks')
      .select('*, profiles!blocked_id(id, username, full_name, avatar_url)')
      .eq('blocker_id', userId)
    setBlocks(data || [])
  }

  async function getMutes(userId) {
    const { data } = await supabase
      .from('mutes')
      .select('*, profiles!muted_id(id, username, full_name, avatar_url)')
      .eq('muter_id', userId)
    setMutes(data || [])
  }

  async function updateProfile(updates) {
    setSaving(true)
    await supabase.from('profiles').update(updates).eq('id', user.id)
    await getProfile(user.id)
    setSaving(false)
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) { setPasswordMsg('6文字以上で入力してください'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPasswordMsg('エラー: ' + error.message); return }
    setPasswordMsg('パスワードを変更しました')
    setNewPassword('')
    setTimeout(() => setPasswordMsg(''), 3000)
  }

  async function deleteAccount() {
    if (!confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) return
    if (!confirm('すべての投稿・メッセージも削除されます。本当によろしいですか？')) return
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.auth.signOut()
    router.push('/')
  }

  async function unblock(blockId) {
    await supabase.from('blocks').delete().eq('id', blockId)
    await getBlocks(user.id)
  }

  async function unmute(muteId) {
    await supabase.from('mutes').delete().eq('id', muteId)
    await getMutes(user.id)
  }

  function Toggle({ value, onChange, label, description }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a18' }}>{label}</div>
          {description && <div style={{ fontSize: '12px', color: '#a0a09c', marginTop: '2px' }}>{description}</div>}
        </div>
        <div
          onClick={() => onChange(!value)}
          style={{
            width: '44px', height: '24px', borderRadius: '12px',
            background: value ? '#1D9E75' : '#d0cec8',
            position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
          }}
        >
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
            position: 'absolute', top: '3px', left: value ? '23px' : '3px',
            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }} />
        </div>
      </div>
    )
  }

  function UserRow({ p, actionLabel, actionColor = '#c04020', onAction }) {
    const name = p?.full_name || p?.username || '名無し'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          background: '#E1F5EE', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden'
        }}>
          {p?.avatar_url ? <img src={p.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{name}</div>
          {p?.username && <div style={{ fontSize: '11px', color: '#a0a09c' }}>@{p.username}</div>}
        </div>
        <button onClick={onAction} style={{
          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
          border: `0.5px solid ${actionColor}`, color: actionColor, background: 'none', cursor: 'pointer'
        }}>{actionLabel}</button>
      </div>
    )
  }

  const SECTIONS = [
    { key: 'account', label: 'アカウント', icon: '👤' },
    { key: 'privacy', label: 'プライバシー', icon: '🔒' },
    { key: 'notification', label: '通知', icon: '🔔' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>設定</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px' }}>

          {/* サイドバー */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '8px', height: 'fit-content' }}>
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setSection(s.key)} style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '14px', fontWeight: section === s.key ? '600' : '400',
                color: section === s.key ? '#1a1a18' : '#6b6b67',
                background: section === s.key ? '#f0eeea' : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left'
              }}>
                <span style={{ fontSize: '16px' }}>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>

          {/* メインコンテンツ */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem' }}>

            {/* アカウント */}
            {section === 'account' && (
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '1.25rem' }}>アカウント情報</div>

                <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '14px', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#a0a09c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>メールアドレス</div>
                  <div style={{ fontSize: '14px', color: '#1a1a18' }}>{user?.email}</div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '10px' }}>パスワードを変更</div>
                  <input
                    type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="新しいパスワード（6文字以上）"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
                  />
                  {passwordMsg && (
                    <div style={{ fontSize: '13px', color: passwordMsg.includes('エラー') ? '#c04020' : '#0d6e50', marginBottom: '8px' }}>{passwordMsg}</div>
                  )}
                  <button onClick={changePassword} style={{
                    padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                    background: '#1a1a18', color: '#fff', border: 'none', cursor: 'pointer'
                  }}>変更する</button>
                </div>

                <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', paddingTop: '1.25rem' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#c04020', marginBottom: '6px' }}>アカウントを削除</div>
                  <div style={{ fontSize: '12px', color: '#a0a09c', marginBottom: '10px' }}>この操作は取り消せません。すべてのデータが削除されます。</div>
                  <button onClick={deleteAccount} style={{
                    padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                    background: 'none', color: '#c04020', border: '1px solid #c04020', cursor: 'pointer'
                  }}>アカウントを削除する</button>
                </div>
              </div>
            )}

            {/* プライバシー */}
            {section === 'privacy' && (
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '1.25rem' }}>プライバシー設定</div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#6b6b67', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>ポストの表示</div>
                  <Toggle
                    value={profile?.is_private || false}
                    onChange={v => updateProfile({ is_private: v })}
                    label="🔒 鍵垢にする"
                    description="フォロワーのみ企画・投稿を閲覧できます"
                  />
                  <Toggle
                    value={profile?.is_sensitive || false}
                    onChange={v => updateProfile({ is_sensitive: v })}
                    label="⚠️ センシティブコンテンツ"
                    description="センシティブな内容を含む投稿として表示します"
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#6b6b67', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>ブロックリスト</div>
                  {blocks.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#a0a09c' }}>ブロックしているユーザーはいません</div>
                  ) : blocks.map(b => (
                    <UserRow key={b.id} p={b.profiles} actionLabel="解除" onAction={() => unblock(b.id)} />
                  ))}
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#6b6b67', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>ミュートリスト</div>
                  {mutes.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#a0a09c' }}>ミュートしているユーザーはいません</div>
                  ) : mutes.map(m => (
                    <UserRow key={m.id} p={m.profiles} actionLabel="解除" actionColor="#6b6b67" onAction={() => unmute(m.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* 通知 */}
            {section === 'notification' && (
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '1.25rem' }}>通知設定</div>
                <Toggle
                  value={profile?.notify_dm !== false}
                  onChange={v => updateProfile({ notify_dm: v })}
                  label="💬 DM通知"
                  description="新しいメッセージを受信したときに通知します"
                />
                <Toggle
                  value={profile?.notify_like !== false}
                  onChange={v => updateProfile({ notify_like: v })}
                  label="❤️ いいね通知"
                  description="投稿にいいねされたときに通知します"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
