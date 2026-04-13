'use client'
import { Suspense } from 'react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function MessagesContent() {
  const [user, setUser] = useState(null)
  const [threads, setThreads] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => { init() }, [])
  useEffect(() => { if (selectedId) getMessages(selectedId) }, [selectedId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await getThreads(user.id)
    const toId = searchParams.get('to')
    if (toId) setSelectedId(toId)
    setLoading(false)
  }

  async function getThreads(userId) {
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    if (!data) return
    const otherIds = [...new Set(data.map(m => m.sender_id === userId ? m.receiver_id : m.sender_id))]
    setThreads(otherIds)
    if (otherIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, full_name, is_company, company_name')
        .in('id', otherIds)
      const map = {}
      profileData?.forEach(p => map[p.id] = p)
      setProfiles(map)
    }
  }

  async function getMessages(otherId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    await supabase.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', otherId)
  }

  async function sendMessage() {
    if (!content.trim() || !selectedId || !user) return
    const { data } = await supabase.from('messages').insert({
      sender_id: user.id, receiver_id: selectedId, content: content.trim()
    }).select().single()
    if (data) {
      setMessages(prev => [...prev, data])
      setContent('')
      if (!threads.includes(selectedId)) {
        setThreads(prev => [...prev, selectedId])
        const { data: p } = await supabase.from('profiles').select('id, username, full_name, is_company, company_name').eq('id', selectedId).single()
        if (p) setProfiles(prev => ({ ...prev, [p.id]: p }))
      }
    }
  }

  function getName(id) {
    const p = profiles[id]
    if (!p) return '...'
    return p.is_company ? p.company_name : p.full_name || p.username || '名無し'
  }

  function formatTime(ts) {
    const d = new Date(ts)
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '12px', height: 'calc(100vh - 120px)' }}>
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>メッセージ</div>
            {threads.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>まだメッセージがありません</div>
            ) : (
              threads.map(id => (
                <div key={id} onClick={() => setSelectedId(id)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer', background: selectedId === id ? '#f0eeea' : '#fff'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: '#E1F5EE', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#0F6E56'
                  }}>{getName(id)[0]}</div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a18' }}>{getName(id)}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedId ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a09c', fontSize: '13px' }}>相手を選んでください</div>
            ) : (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#0F6E56' }}>{getName(selectedId)[0]}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{getName(selectedId)}</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {messages.map(m => {
                    const isMe = m.sender_id === user?.id
                    return (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '75%', padding: '8px 12px',
                          borderRadius: isMe ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                          fontSize: '13px', lineHeight: '1.6',
                          background: isMe ? '#1D9E75' : '#f0eeea',
                          color: isMe ? '#fff' : '#1a1a18'
                        }}>{m.content}</div>
                        <div style={{ fontSize: '10px', color: '#a0a09c', marginTop: '3px' }}>{formatTime(m.created_at)}</div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>
                <div style={{ padding: '10px 14px', borderTop: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={content} onChange={e => setContent(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="メッセージを入力... (Enterで送信)"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', background: '#f5f4f0' }}
                  />
                  <button onClick={sendMessage} style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1D9E75', color: '#fff', border: 'none', fontSize: '16px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}><div style={{ color: '#6b6b67' }}>読み込み中...</div></div>}>
      <MessagesContent />
    </Suspense>
  )
}