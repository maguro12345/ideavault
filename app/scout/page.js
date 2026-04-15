 'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CompanyNavbar from '../../components/CompanyNavbar'

function ScoutContent() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [idea, setIdea] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    offer_type: '共同開発',
    content: '',
    conditions: ''
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const ideaId = searchParams.get('idea')
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile?.is_company) { router.push('/'); return }
    setProfile(profile)
    if (ideaId) {
      const { data: idea } = await supabase
        .from('ideas')
        .select('*, profiles(id, full_name, username, company_name, is_company)')
        .eq('id', ideaId).single()
      setIdea(idea)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.content.trim()) { alert('提案内容を入力してください'); return }
    setSending(true)

    const { data: currentProfile } = await supabase
      .from('profiles').select('scout_count_this_month, scout_limit, scout_count_reset_at').eq('id', user.id).single()

    const resetAt = new Date(currentProfile?.scout_count_reset_at || 0)
    const now = new Date()
    if (resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
      await supabase.from('profiles').update({ scout_count_this_month: 0, scout_count_reset_at: now.toISOString() }).eq('id', user.id)
      currentProfile.scout_count_this_month = 0
    }

    const limit = currentProfile?.scout_limit ?? 5
    const count = currentProfile?.scout_count_this_month ?? 0
    if (count >= limit) {
      alert(`今月のスカウト送信数（${limit}件）に達しました。プランをアップグレードしてください。`)
      setSending(false)
      router.push('/company/plan')
      return
    }

    const { error } = await supabase.from('scouts').insert({
      from_company_id: user.id,
      to_user_id: idea.user_id,
      idea_id: ideaId,
      offer_type: form.offer_type,
      content: form.content,
      conditions: form.conditions,
      status: 'pending'
    })

    if (error) { alert('エラー: ' + error.message); setSending(false); return }

    await supabase.from('notifications').insert({
      user_id: idea.user_id,
      from_id: user.id,
      type: 'scout',
      idea_id: ideaId
    })

    await supabase.from('profiles').update({
      scout_count_this_month: (count + 1)
    }).eq('id', user.id)

    router.push('/company/scouts')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  const targetName = idea?.profiles?.is_company ? idea?.profiles?.company_name : idea?.profiles?.full_name || idea?.profiles?.username || '名無し'
  const remaining = (profile?.scout_limit ?? 5) - (profile?.scout_count_this_month ?? 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      <CompanyNavbar />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#1a3a5c', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.5px' }}>
              🏢 {profile?.company_name}
            </div>
            <div style={{ fontSize: '13px', color: '#6b6b67' }}>としてスカウトを送信</div>
          </div>
          <div style={{ fontSize: '12px', color: remaining <= 1 ? '#c04020' : '#6b6b67', background: remaining <= 1 ? '#fdeae4' : '#f0eeea', padding: '4px 10px', borderRadius: '20px' }}>
            残り {remaining < 0 ? 0 : remaining} 件
          </div>
        </div>

        {idea && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#a0a09c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>スカウト対象のアイデア</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '4px' }}>{idea.title}</div>
            <div style={{ fontSize: '13px', color: '#6b6b67' }}>投稿者：{targetName}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1a3a5c', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>提案内容</div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '8px' }}>提案の種類 <span style={{ color: '#c04020' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['共同開発', '業務提携', '投資', '買収', 'ライセンス', 'その他'].map(type => (
                  <button key={type} type="button" onClick={() => setForm({ ...form, offer_type: type })} style={{
                    padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
                    border: `1.5px solid ${form.offer_type === type ? '#1a3a5c' : 'rgba(0,0,0,0.1)'}`,
                    background: form.offer_type === type ? '#eef2f7' : '#fff',
                    color: form.offer_type === type ? '#1a3a5c' : '#6b6b67', cursor: 'pointer'
                  }}>{type}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>
                提案内容 <span style={{ color: '#c04020' }}>*</span>
              </label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="なぜこのアイデアに関心を持ったか、どのような形で一緒に進めたいかを具体的に記載してください"
                rows={6} style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>条件・報酬（任意）</label>
              <textarea value={form.conditions} onChange={e => setForm({ ...form, conditions: e.target.value })}
                placeholder="例：株式の〇%、月額〇万円、売上の〇%など"
                rows={3} style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ background: '#eef2f7', borderRadius: '12px', padding: '12px 14px', marginBottom: '1rem', display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>ℹ️</span>
            <div style={{ fontSize: '12px', color: '#1a3a5c', lineHeight: '1.6' }}>
              スカウトを送信すると相手に通知が届きます。双方が合意した場合、3,000円の成功手数料が発生します。送信後の取り消しはできません。
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={() => router.push('/company/scouts')} style={{
              padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
              border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67',
              background: 'none', cursor: 'pointer'
            }}>キャンセル</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => router.push('/company/plan')} style={{
                padding: '10px 16px', borderRadius: '10px', fontSize: '13px',
                border: '0.5px solid #1a3a5c', color: '#1a3a5c',
                background: 'none', cursor: 'pointer'
              }}>プランを確認</button>
              <button type="submit" disabled={sending} style={{
                background: '#1a3a5c', color: '#fff', border: 'none',
                padding: '10px 28px', borderRadius: '10px', fontSize: '14px',
                fontWeight: '600', cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending ? 0.7 : 1
              }}>{sending ? '送信中...' : '🏢 スカウトを送信する'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ScoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}><div style={{ color: '#6b6b67' }}>読み込み中...</div></div>}>
      <ScoutContent />
    </Suspense>
  )
}