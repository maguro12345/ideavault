'use client'
import { Suspense } from 'react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/Navbar'


function MessagesContent() {
  const [user, setUser] = useState(null)
  const [threads, setThreads] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedDM, setSelectedDM] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dm')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [followers, setFollowers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const bottomRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => { init() }, [])
  useEffect(() => { if (selectedDM) getDMMessages(selectedDM) }, [selectedDM])
  useEffect(() => { if (selectedGroup) getGroupMessages(selectedGroup) }, [selectedGroup])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    await getThreads(user.id)
    await getGroups(user.id)
    await getFollowers(user.id)
    const toId = searchParams.get('to')
    if (toId) setSelectedDM(toId)
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
        .from('profiles').select('id, username, full_name, is_company, company_name, avatar_url')
        .in('id', otherIds)
      const map = {}
      profileData?.forEach(p => map[p.id] = p)
      setProfiles(prev => ({ ...prev, ...map }))
    }
  }

  async function getGroups(userId) {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, created_by)')
      .eq('user_id', userId)
    setGroups(data?.map(d => d.groups).filter(Boolean) || [])
  }

  async function getFollowers(userId) {
    const { data } = await supabase
      .from('follows')
      .select('follower_id, profiles!follower_id(id, username, full_name, avatar_url)')
      .eq('following_id', userId)
    setFollowers(data?.map(d => d.profiles).filter(Boolean) || [])
  }

  async function getDMMessages(otherId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    await supabase.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', otherId)

    if (!profiles[otherId]) {
      const { data: p } = await supabase.from('profiles').select('id, username, full_name, is_company, company_name, avatar_url').eq('id', otherId).single()
      if (p) setProfiles(prev => ({ ...prev, [p.id]: p }))
    }
  }

  async function getGroupMessages(groupId) {
    const { data } = await supabase
      .from('group_messages')
      .select('*, profiles(id, username, full_name, avatar_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendDM() {
    if (!content.trim() || !selectedDM || !user) return
    const { data } = await supabase.from('messages').insert({
      sender_id: user.id, receiver_id: selectedDM, content: content.trim()
    }).select().single()
    if (data) {
      setMessages(prev => [...prev, data])
      setContent('')
      if (!threads.includes(selectedDM)) {
        setThreads(prev => [...prev, selectedDM])
      }
    }
  }

  async function sendGroupMessage() {
    if (!content.trim() || !selectedGroup || !user) return
    const { data } = await supabase.from('group_messages').insert({
      group_id: selectedGroup, sender_id: user.id, content: content.trim()
    }).select('*, profiles(id, username, full_name, avatar_url)').single()
    if (data) {
      setMessages(prev => [...prev, data])
      setContent('')
    }
  }

  async function createGroup() {
    if (!groupName.trim()) { alert('グループ名を入力してください'); return }
    if (selectedMembers.length === 0) { alert('メンバーを選択してください'); return }

    const { data: group } = await supabase.from('groups').insert({
      name: groupName, created_by: user.id
    }).select().single()

    if (!group) return

    const members = [user.id, ...selectedMembers].map(uid => ({ group_id: group.id, user_id: uid }))
    await supabase.from('group_members').insert(members)

    setGroupName('')
    setSelectedMembers([])
    setShowNewGroup(false)
    await getGroups(user.id)
    setSelectedGroup(group.id)
    setTab('group')
  }

  function getName(id) {
    const p = profiles[id]
    if (!p) return '...'
    return p.is_company ? p.company_name : p.full_name || p.username || '名無し'
  }

  function getGroupName(id) {
    return groups.find(g => g.id === id)?.name || 'グループ'
  }

  function formatTime(ts) {
    const d = new Date(ts)
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  function Avatar({ profile, size = 36 }) {
    const n = profile?.full_name || profile?.username || '?'
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: '#E1F5EE', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: size * 0.35, fontWeight: '600',
        color: '#0F6E56', overflow: 'hidden'
      }}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : n[0]
        }
      </div>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '12px', height: 'calc(100vh - 120px)' }}>

          {/* 左サイドバー */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* タブ */}
            <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
              {[{ key: 'dm', label: 'DM' }, { key: 'group', label: 'グループ' }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  flex: 1, padding: '12px', fontSize: '13px', fontWeight: tab === t.key ? '700' : '400',
                  color: tab === t.key ? '#1a1a18' : '#6b6b67',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: tab === t.key ? '2px solid #1a1a18' : '2px solid transparent'
                }}>{t.label}</button>
              ))}
            </div>

            {/* DM一覧 */}
            {tab === 'dm' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {threads.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>まだメッセージがありません</div>
                ) : threads.map(id => (
                  <div key={id} onClick={() => { setSelectedDM(id); setSelectedGroup(null) }} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer', background: selectedDM === id ? '#f0eeea' : '#fff'
                  }}>
                    <Avatar profile={profiles[id]} />
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a18' }}>{getName(id)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* グループ一覧 */}
            {tab === 'group' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => setShowNewGroup(true)} style={{
                  margin: '10px', padding: '8px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                  background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer'
                }}>＋ 新しいグループ</button>

                {groups.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>グループがありません</div>
                ) : groups.map(g => (
                  <div key={g.id} onClick={() => { setSelectedGroup(g.id); setSelectedDM(null) }} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer', background: selectedGroup === g.id ? '#f0eeea' : '#fff'
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#E1F5EE', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '16px', flexShrink: 0
                    }}>👥</div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a18' }}>{g.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* チャット画面 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {(!selectedDM && !selectedGroup) ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a09c', fontSize: '13px' }}>
                相手またはグループを選んでください
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedDM ? (
                    <>
                      <Avatar profile={profiles[selectedDM]} size={28} />
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{getName(selectedDM)}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '18px' }}>👥</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{getGroupName(selectedGroup)}</div>
                    </>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {messages.map(m => {
                    const isMe = m.sender_id === user?.id
                    const senderProfile = m.profiles
                    return (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        {selectedGroup && !isMe && senderProfile && (
                          <div style={{ fontSize: '11px', color: '#a0a09c', marginBottom: '3px', paddingLeft: '4px' }}>
                            {senderProfile.full_name || senderProfile.username}
                          </div>
                        )}
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
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (selectedDM ? sendDM() : sendGroupMessage())}
                    placeholder="メッセージを入力... (Enterで送信)"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', background: '#f5f4f0' }}
                  />
                  <button onClick={selectedDM ? sendDM : sendGroupMessage} style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: '#1D9E75', color: '#fff', border: 'none',
                    fontSize: '16px', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>↑</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* グループ作成モーダル */}
      {showNewGroup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 100
        }} onClick={e => e.target === e.currentTarget && setShowNewGroup(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '1rem' }}>新しいグループを作成</div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>グループ名</label>
              <input value={groupName} onChange={e => setGroupName(e.target.value)}
                placeholder="例：プロジェクトチームA"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '8px' }}>メンバーを選択（フォロワーから）</label>
              {followers.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#a0a09c' }}>フォロワーがいません</div>
              ) : followers.map(f => (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input type="checkbox"
                    checked={selectedMembers.includes(f.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedMembers(prev => [...prev, f.id])
                      else setSelectedMembers(prev => prev.filter(id => id !== f.id))
                    }}
                  />
                  <Avatar profile={f} size={28} />
                  <span style={{ fontSize: '13px', color: '#1a1a18' }}>{f.full_name || f.username}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowNewGroup(false)} style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: 'none', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={createGroup} style={{ padding: '8px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>作成する</button>
            </div>
          </div>
        </div>
      )}
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