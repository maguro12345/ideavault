 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

export default function ScoutsPage() {
  const [user, setUser] = useState(null)
  const [scouts, setScouts] = useState([])
  const [sentScouts, setSentScouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('received')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await getReceivedScouts(user.id)
    await getSentScouts(user.id)
    setLoading(false)
  }

  async function getReceivedScouts(userId) {
    const { data } = await supabase
      .from('scouts')
      .select('*, profiles!from_company_id(id, company_name, full_name, avatar_url, industry, company_type), ideas(id, title)')
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })
    setScouts(data || [])
  }

  async function getSentScouts(userId) {
    const { data } = await supabase
      .from('scouts')
      .select('*, profiles!to_user_id(id, full_name, username, avatar_url), ideas(id, title)')
      .eq('from_company_id', userId)
      .order('created_at', { ascending: false })
    setSentScouts(data || [])
  }

  async function handleAccept(scout) {
    await supabase.from('scouts').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', scout.id)
    await supabase.from('notifications').insert({
      user_id: scout.from_company_id,
      from_id: user.id,
      type: 'scout_accepted',
      idea_id: scout.idea_id
    })
    await getReceivedScouts(user.id)
    router.push(`/messages?to=${scout.from_company_id}`)
  }

  async function handleReject(scoutId) {
    if (!confirm('このスカウトを辞退しますか？')) return
    await supabase.from('scouts').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', scoutId)
    await getReceivedScouts(user.id)
  }

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }

  const STATUS = {
    pending:  { label: '返答待ち', bg: '#fdecd4', color: '#8a4f0a' },
    accepted: { label: '承諾済み', bg: '#d8f2ea', color: '#0d6e50' },
    rejected: { label: '辞退済み', bg: '#eeecea', color: '#5a5a56' }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>スカウト</h1>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}>
          {[{ key: 'received', label: `受信 ${scouts.length}` }, { key: 'sent', label: `送信 ${sentScouts.length}` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '7px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer',
              background: tab === t.key ? '#1a1a18' : '#fff',
              color: tab === t.key ? '#fff' : '#6b6b67'
            }}>{t.label}</button>
          ))}
        </div>

        {/* 受信スカウト */}
        {tab === 'received' && (
          scouts.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4rem', textAlign: 'center', color: '#a0a09c' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px' }}>まだスカウトは届いていません</div>
            </div>
          ) : scouts.map(scout => {
            const company = scout.profiles
            const companyName = company?.company_name || company?.full_name || '名無し'
            const status = STATUS[scout.status] || STATUS.pending
            return (
              <div key={scout.id} style={{ background: '#fff', borderRadius: '14px', border: `0.5px solid ${scout.status === 'pending' ? '#1a3a5c' : 'rgba(0,0,0,0.1)'}`, padding: '1.5rem', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                      background: '#1a3a5c', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '18px'
                    }}>🏢</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18' }}>{companyName}</div>
                      <div style={{ fontSize: '12px', color: '#6b6b67' }}>{company?.company_type} {company?.industry ? `・${company.industry}` : ''}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', background: status.bg, color: status.color }}>{status.label}</span>
                </div>

                <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#a0a09c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>対象企画</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{scout.ideas?.title}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'inline-block', background: '#eef2f7', color: '#1a3a5c', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', marginBottom: '8px' }}>{scout.offer_type}</div>
                  <div style={{ fontSize: '14px', color: '#1a1a18', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{scout.content}</div>
                  {scout.conditions && (
                    <div style={{ marginTop: '10px', padding: '10px 12px', background: '#f5f4f0', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#a0a09c', marginBottom: '3px' }}>条件・報酬</div>
                      <div style={{ fontSize: '13px', color: '#1a1a18' }}>{scout.conditions}</div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: '#a0a09c', marginBottom: '12px' }}>{formatDate(scout.created_at)}</div>

                {scout.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleAccept(scout)} style={{
                      flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                      background: '#1a3a5c', color: '#fff', border: 'none', cursor: 'pointer'
                    }}>✓ 承諾してチャットを開始</button>
                    <button onClick={() => handleReject(scout.id)} style={{
                      padding: '10px 18px', borderRadius: '10px', fontSize: '14px',
                      background: 'none', color: '#c04020', border: '0.5px solid #c04020', cursor: 'pointer'
                    }}>辞退</button>
                  </div>
                )}

                {scout.status === 'accepted' && (
                  <button onClick={() => router.push(`/messages?to=${scout.from_company_id}`)} style={{
                    width: '100%', padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                    background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer'
                  }}>💬 チャットを開く</button>
                )}
              </div>
            )
          })
        )}

        {/* 送信スカウト */}
        {tab === 'sent' && (
          sentScouts.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4rem', textAlign: 'center', color: '#a0a09c' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📤</div>
              <div style={{ fontSize: '14px' }}>まだスカウトを送っていません</div>
            </div>
          ) : sentScouts.map(scout => {
            const target = scout.profiles
            const targetName = target?.full_name || target?.username || '名無し'
            const status = STATUS[scout.status] || STATUS.pending
            return (
              <div key={scout.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>{targetName}さんへのスカウト</div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', background: status.bg, color: status.color }}>{status.label}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '6px' }}>対象：{scout.ideas?.title}</div>
                <div style={{ display: 'inline-block', background: '#eef2f7', color: '#1a3a5c', fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', marginBottom: '8px' }}>{scout.offer_type}</div>
                <div style={{ fontSize: '13px', color: '#1a1a18', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{scout.content}</div>
                <div style={{ fontSize: '11px', color: '#a0a09c', marginTop: '8px' }}>{formatDate(scout.created_at)}</div>
                {scout.status === 'accepted' && (
                  <button onClick={() => router.push(`/messages?to=${scout.to_user_id}`)} style={{
                    marginTop: '10px', width: '100%', padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                    background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer'
                  }}>💬 チャットを開く</button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
