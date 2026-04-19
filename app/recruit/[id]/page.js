'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/Navbar'

export default function RecruitDetailPage() {
  const [user, setUser] = useState(null)
  const [posting, setPosting] = useState(null)
  const [applications, setApplications] = useState([])
  const [myApplication, setMyApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCompany, setIsCompany] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ title: '', concept: '', features: '', revenue: '', edge: '', message: '' })
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data: p } = await supabase.from('job_postings')
      .select('*, profiles(id, company_name, full_name, avatar_url, is_verified, company_type, company_description, industry, location)')
      .eq('id', params.id).single()
    if (!p) { router.push('/'); return }
    setPosting(p)

    if (user) {
      const { data: prof } = await supabase.from('profiles').select('is_company').eq('id', user.id).single()
      setIsCompany(prof?.is_company || false)
      setIsOwner(p.company_id === user.id)

      if (p.company_id === user.id) {
        const { data: apps } = await supabase.from('recruit_applications')
          .select('*, profiles(id, full_name, username, avatar_url, bio, tags)')
          .eq('posting_id', params.id)
          .order('created_at', { ascending: false })
        setApplications(apps || [])
      } else {
        const { data: myApp } = await supabase.from('recruit_applications')
          .select('*').eq('posting_id', params.id).eq('user_id', user.id).single()
        setMyApplication(myApp || null)
      }
    }
    setLoading(false)
  }

  async function submitApplication() {
    if (!form.title.trim()) { alert('タイトルを入力してください'); return }
    if (!form.concept.trim()) { alert('コンセプトを入力してください'); return }
    setSending(true)
    const { error } = await supabase.from('recruit_applications').insert({
      posting_id: params.id,
      user_id: user.id,
      ...form
    })
    if (error) { alert('エラー: ' + error.message); setSending(false); return }
    // 企業に通知
    await supabase.from('notifications').insert({
      user_id: posting.company_id, from_id: user.id, type: 'scout', idea_id: params.id
    })
    setSending(false)
    setShowForm(false)
    await init()
  }

  async function updateStatus(appId, status) {
    await supabase.from('recruit_applications').update({ status }).eq('id', appId)
    await init()
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  const cName = posting.profiles?.company_name || posting.profiles?.full_name || '企業'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* 募集詳細 */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', overflow: 'hidden', flexShrink: 0 }}>
              {posting.profiles?.avatar_url ? <img src={posting.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{cName}</div>
                {posting.profiles?.is_verified && <span style={{ fontSize: '10px', background: '#d8f2ea', color: '#0d6e50', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>✅ 認証済み</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#6b6b67' }}>{posting.profiles?.industry} · {posting.profiles?.location}</div>
            </div>
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a18', marginBottom: '12px', lineHeight: '1.3' }}>{posting.title}</h1>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '11px', background: '#d8f2ea', color: '#0d6e50', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>📢 募集中</span>
            {posting.industry && <span style={{ fontSize: '11px', background: '#eef2f7', color: '#1a3a5c', padding: '3px 10px', borderRadius: '20px' }}>{posting.industry}</span>}
            {posting.scale && <span style={{ fontSize: '11px', background: '#f0eeea', color: '#6b6b67', padding: '3px 10px', borderRadius: '20px' }}>{posting.scale}</span>}
            {posting.budget && <span style={{ fontSize: '11px', background: '#fdecd4', color: '#8a4f0a', padding: '3px 10px', borderRadius: '20px' }}>💰 {posting.budget}</span>}
          </div>

          {posting.description && (
            <div style={{ fontSize: '14px', color: '#6b6b67', lineHeight: '1.9', marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>{posting.description}</div>
          )}

          {posting.profiles?.company_description && (
            <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#a0a09c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>企業について</div>
              <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.7' }}>{posting.profiles.company_description}</div>
            </div>
          )}

          {posting.keywords && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {posting.keywords.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                <span key={k} style={{ fontSize: '11px', background: '#E1F5EE', color: '#0d6e50', padding: '3px 10px', borderRadius: '20px' }}>{k}</span>
              ))}
            </div>
          )}

          <div style={{ fontSize: '11px', color: '#a0a09c' }}>投稿日：{formatDate(posting.created_at)}</div>
        </div>

        {/* 応募ボタン・フォーム */}
        {user && !isOwner && !isCompany && (
          <div style={{ marginBottom: '12px' }}>
            {myApplication ? (
              <div style={{ background: '#E1F5EE', borderRadius: '14px', border: '1px solid #1D9E75', padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', marginBottom: '6px' }}>✅</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d6e50' }}>応募済みです</div>
                <div style={{ fontSize: '12px', color: '#0d6e50', marginTop: '4px' }}>「{myApplication.title}」で応募しました（{formatDate(myApplication.created_at)}）</div>
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: '600',
                    background: myApplication.status === 'accepted' ? '#d8f2ea' : myApplication.status === 'rejected' ? '#fdeae4' : '#f0eeea',
                    color: myApplication.status === 'accepted' ? '#0d6e50' : myApplication.status === 'rejected' ? '#c04020' : '#6b6b67'
                  }}>
                    {myApplication.status === 'accepted' ? '✅ 承認されました' : myApplication.status === 'rejected' ? '❌ 不採用' : '⏳ 審査中'}
                  </span>
                </div>
              </div>
            ) : showForm ? (
              <div style={{ background: '#fff', borderRadius: '14px', border: '1.5px solid #1D9E75', padding: '1.5rem' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '1.25rem' }}>📝 アイデアを応募する</div>
                <div style={{ background: '#faeeda', borderRadius: '10px', padding: '10px 12px', marginBottom: '1.25rem', fontSize: '12px', color: '#8a4f0a' }}>
                  ⚠️ 応募内容は募集した企業のみが閲覧できます。他のユーザーには表示されません。
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>アイデアタイトル <span style={{ color: '#c04020' }}>*</span></label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例：AIを活用したフードロス削減サービス" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>コンセプト <span style={{ color: '#c04020' }}>*</span></label>
                  <textarea value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })}
                    placeholder="このアイデアが解決する課題と提供する価値" rows={4}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>主な機能・サービス</label>
                  <textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })}
                    placeholder="・機能1&#10;・機能2" rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>収益モデル</label>
                  <textarea value={form.revenue} onChange={e => setForm({ ...form, revenue: e.target.value })}
                    placeholder="例：月額サブスク・手数料など" rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>差別化の本質</label>
                  <textarea value={form.edge} onChange={e => setForm({ ...form, edge: e.target.value })}
                    placeholder="競合と何が根本的に違うのか" rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>企業へのメッセージ</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="なぜこの企業と組みたいか、自己PRなど" rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: '#fff', cursor: 'pointer' }}>キャンセル</button>
                  <button onClick={submitApplication} disabled={sending} style={{ padding: '9px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>{sending ? '送信中...' : '応募する'}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { if (!user) { router.push('/login'); return } setShowForm(true) }}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '15px', fontWeight: '700', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>
                📝 この募集にアイデアを応募する
              </button>
            )}
          </div>
        )}

        {!user && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '6px' }}>応募するにはログインが必要です</div>
            <Link href="/login" style={{ display: 'inline-block', padding: '9px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', textDecoration: 'none' }}>ログイン・登録</Link>
          </div>
        )}

        {/* 企業側：応募一覧 */}
        {isOwner && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '1.25rem' }}>📋 応募一覧（{applications.length}件）</div>
            {applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a0a09c', fontSize: '13px' }}>まだ応募がありません</div>
            ) : applications.map(app => (
              <div key={app.id} style={{ padding: '1.25rem 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
                      {app.profiles?.avatar_url ? <img src={app.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (app.profiles?.full_name || '?')[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>{app.profiles?.full_name || app.profiles?.username || '名無し'}</div>
                      <div style={{ fontSize: '11px', color: '#a0a09c' }}>{formatDate(app.created_at)}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', flexShrink: 0,
                    background: app.status === 'accepted' ? '#d8f2ea' : app.status === 'rejected' ? '#fdeae4' : '#f0eeea',
                    color: app.status === 'accepted' ? '#0d6e50' : app.status === 'rejected' ? '#c04020' : '#6b6b67'
                  }}>
                    {app.status === 'accepted' ? '✅ 承認' : app.status === 'rejected' ? '❌ 不採用' : '⏳ 審査中'}
                  </span>
                </div>

                <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '6px' }}>{app.title}</div>
                  {app.concept && <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.7', marginBottom: '6px' }}><span style={{ fontWeight: '600', color: '#1a1a18' }}>コンセプト：</span>{app.concept}</div>}
                  {app.features && <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.7', marginBottom: '6px' }}><span style={{ fontWeight: '600', color: '#1a1a18' }}>機能：</span>{app.features}</div>}
                  {app.revenue && <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.7', marginBottom: '6px' }}><span style={{ fontWeight: '600', color: '#1a1a18' }}>収益：</span>{app.revenue}</div>}
                  {app.edge && <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.7', marginBottom: '6px' }}><span style={{ fontWeight: '600', color: '#1a1a18' }}>差別化：</span>{app.edge}</div>}
                  {app.message && <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.7', marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid rgba(0,0,0,0.08)' }}><span style={{ fontWeight: '600', color: '#1a1a18' }}>メッセージ：</span>{app.message}</div>}
                </div>

                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => updateStatus(app.id, 'accepted')} style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>✅ 承認する</button>
                    <button onClick={() => updateStatus(app.id, 'rejected')} style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: '#fff', color: '#c04020', border: '1px solid #c04020', cursor: 'pointer' }}>❌ 不採用にする</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}