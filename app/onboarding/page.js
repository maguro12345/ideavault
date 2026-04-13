 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OnboardingPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    tags: ''
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const { data: profile } = await supabase
      .from('profiles').select('full_name, username').eq('id', user.id).single()

    if (profile?.full_name && profile?.username) {
      router.push('/')
      return
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('名前を入力してください'); return }
    if (!form.username.trim()) { setError('ユーザー名を入力してください'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { setError('ユーザー名は英数字・アンダースコアのみ使えます'); return }

    setSaving(true)
    setError('')

    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', form.username).neq('id', user.id).single()
    if (existing) { setError('このユーザー名はすでに使われています'); setSaving(false); return }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name.trim(),
      username: form.username.trim(),
      bio: form.bio.trim(),
      location: form.location.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    })

    if (error) { setError('エラー: ' + error.message); setSaving(false); return }
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', border: '0.5px solid rgba(0,0,0,0.1)' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-1px', textDecoration: 'none', color: 'inherit' }}>
            IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
          </Link>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18', marginTop: '16px', marginBottom: '6px' }}>
            プロフィールを設定しましょう 👋
          </div>
          <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.6' }}>
            他のユーザーに自分を知ってもらうために、プロフィールを入力してください。
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
              名前 <span style={{ color: '#c04020' }}>*</span>
            </label>
            <input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="例：田中 誠"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
              ユーザー名 <span style={{ color: '#c04020' }}>*</span>
              <span style={{ fontWeight: '400', marginLeft: '6px' }}>（英数字・アンダースコアのみ）</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#a0a09c' }}>@</span>
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '') })}
                placeholder="tanaka_makoto"
                style={{ ...inputStyle, paddingLeft: '28px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
              自己紹介 <span style={{ fontWeight: '400', color: '#a0a09c' }}>（任意）</span>
            </label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="得意なこと、やりたいこと、探しているパートナーなど"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
              所在地 <span style={{ fontWeight: '400', color: '#a0a09c' }}>（任意）</span>
            </label>
            <input
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="例：東京都"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
              タグ <span style={{ fontWeight: '400', color: '#a0a09c' }}>（カンマ区切り・任意）</span>
            </label>
            <input
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="例：SaaS, AI, フードテック"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: '#fdeae4', color: '#c04020', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '11px', background: '#1D9E75',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}>
            {saving ? '保存中...' : 'プロフィールを保存してはじめる →'}
          </button>
        </form>
      </div>
    </div>
  )
}
