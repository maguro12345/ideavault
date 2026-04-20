'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import AdvisorNavbar from '../../../components/AdvisorNavbar'
import Footer from '../../../components/Footer'

export default function ConsultationsPage() {
  const [user, setUser] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [selected, setSelected] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: prof } = await supabase.from('profiles').select('company_type').eq('id', user.id).single()
    if (prof?.company_type !== 'アドバイザー') { router.push('/'); return }
    await fetchConsultations(user.id)
    setLoading(false)
  }

  async function fetchConsultations(userId) {
    const { data } = await supabase.from('consultation_requests')
      .select('*, profiles!user_id(id, full_name, username, avatar_url)')
      .eq('advisor_id', userId)
      .order('created_at', { ascending: false })
    setConsultations(data || [])
  }

  async function submitAnswer() {
    if (!answer.trim()) { alert('回答を入力してください'); return }
    setSaving(true)
    await supabase.from('consultation_requests').update({
      answer, status: 'answered', answered_at: new Date().toISOString()
    }).eq('id', selected.id)
    await supabase.from('notifications').insert({
      user_id: selected.user_id, from_id: user.id, type: 'message', idea_id: selected.id
    })
    setAnswer('')
    setSelected(null)
    await fetchConsultations(user.id)
    setSaving(false)
  }

  async function closeConsultation(id) {
    await supabase.from('consultation_requests').update({ status: 'closed' }).eq('id', id)
    await fetchConsultations(user.id)
  }

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`
  }

  const filtered = consultations.filter(c => filter === 'all' || c.status === filter)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0ff' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0ff', fontFamily: 'system-ui, sans-serif' }}>
      <AdvisorNavbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>💬 相談管理</h1>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ key: 'all', label: 'すべて' }, { key: 'pending', label: '未回答' }, { key: 'answered', label: '回答済み' }, { key: 'closed', label: 'クローズ' }].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer', background: filter === f.key ? '#2d1f5e' : '#fff', color: filter === f.key ? '#fff' : '#6b6b67' }}>{f.label}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>💬</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18' }}>相談がありません</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => { setSelected(c); setAnswer(c.answer || '') }}
                  style={{ background: '#fff', borderRadius: '14px', border: `0.5px solid ${selected?.id === c.id ? '#7F77DD' : 'rgba(0,0,0,0.1)'}`, padding: '1.25rem', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>{c.title}</div>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', flexShrink: 0, background: c.status === 'pending' ? '#fdecd4' : c.status === 'answered' ? '#d8f2ea' : '#f0eeea', color: c.status === 'pending' ? '#8a4f0a' : c.status === 'answered' ? '#0d6e50' : '#6b6b67' }}>
                      {c.status === 'pending' ? '未回答' : c.status === 'answered' ? '回答済み' : 'クローズ'}
                    </span>
                  </div>
                  {c.content && <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '8px' }}>{c.content}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
                      {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.profiles?.full_name || '?')[0]}
                    </div>
                    <span style={{ fontSize: '11px', color: '#a0a09c' }}>{c.profiles?.full_name || c.profiles?.username || '名無し'} · {formatDate(c.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {selected && (
              <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', position: 'sticky', top: '72px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{selected.title}</div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#a0a09c' }}>✕</button>
                </div>
                <div style={{ background: '#f5f0ff', borderRadius: '10px', padding: '12px', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selected.content}</div>
                </div>
                {selected.status !== 'closed' && (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' }}>回答を入力</div>
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                      placeholder="相談者へのアドバイスを記入してください" rows={6}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', resize: 'vertical', lineHeight: '1.7', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '10px' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={submitAnswer} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#2d1f5e', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '送信中...' : '回答する'}</button>
                      {selected.status === 'answered' && (
                        <button onClick={() => closeConsultation(selected.id)} style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: '#fff', cursor: 'pointer' }}>クローズ</button>
                      )}
                    </div>
                  </>
                )}
                {selected.answer && (
                  <div style={{ marginTop: '1rem', background: '#d8f2ea', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#0d6e50', marginBottom: '6px' }}>送信済みの回答</div>
                    <div style={{ fontSize: '13px', color: '#1a1a18', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selected.answer}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}