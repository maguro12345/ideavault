'use client'
import { Suspense } from 'react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '../../components/Navbar'
import CompanyNavbar from '../../components/CompanyNavbar'

function MessagesContent() {
  const [user, setUser] = useState(null)
  const [isCompany, setIsCompany] = useState(false)
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
  const [uploading, setUploading] = useState(false)
  const [showPoll, setShowPoll] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [polls, setPolls] = useState([])
  const [myVotes, setMyVotes] = useState({})
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => { init() }, [])
  useEffect(() => { if (selectedDM) getDMMessages(selectedDM) }, [selectedDM])
  useEffect(() => { if (selectedGroup) { getGroupMessages(selectedGroup); getPolls(selectedGroup) } }, [selectedGroup])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, polls])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: prof } = await supabase.from('profiles').select('is_company').eq('id', user.id).single()
    setIsCompany(prof?.is_company || false)
    await getThreads(user.id)
    await getGroups(user.id)
    await getFollowers(user.id)
    const toId = searchParams.get('to')
    if (toId) setSelectedDM(toId)
    setLoading(false)
  }

  async function getThreads(userId) {
    const { data } = await supabase.from('messages').select('sender_id, receiver_id').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    if (!data) return
    const otherIds = [...new Set(data.map(m => m.sender_id === userId ? m.receiver_id : m.sender_id))]
    setThreads(otherIds)
    if (otherIds.length > 0) {
      const { data: profileData } = await supabase.from('profiles').select('id, username, full_name, is_company, company_name, avatar_url').in('id', otherIds)
      const map = {}
      profileData?.forEach(p => map[p.id] = p)
      setProfiles(prev => ({ ...prev, ...map }))
    }
  }

  async function getGroups(userId) {
    const { data } = await supabase.from('group_members').select('group_id, groups(id, name, created_by)').eq('user_id', userId)
    setGroups(data?.map(d => d.groups).filter(Boolean) || [])
  }

  async function getFollowers(userId) {
    const { data } = await supabase.from('follows').select('follower_id, profiles!follower_id(id, username, full_name, avatar_url)').eq('following_id', userId)
    setFollowers(data?.map(d => d.profiles).filter(Boolean) || [])
  }

  async function getDMMessages(otherId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`).order('created_at', { ascending: true })
    setMessages(data || [])
    await supabase.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', otherId)
    if (!profiles[otherId]) {
      const { data: p } = await supabase.from('profiles').select('id, username, full_name, is_company, company_name, avatar_url').eq('id', otherId).single()
      if (p) setProfiles(prev => ({ ...prev, [p.id]: p }))
    }
  }

  async function getGroupMessages(groupId) {
    const { data } = await supabase.from('group_messages').select('*, profiles(id, username, full_name, avatar_url)').eq('group_id', groupId).order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function getPolls(groupId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pollData } = await supabase.from('polls').select('*').eq('group_id', groupId).order('created_at', { ascending: true })
    setPolls(pollData || [])
    if (pollData && pollData.length > 0) {
      const { data: voteData } = await supabase.from('poll_votes').select('poll_id, option_index').eq('user_id', user.id).in('poll_id', pollData.map(p => p.id))
      const voteMap = {}
      voteData?.forEach(v => voteMap[v.poll_id] = v.option_index)
      setMyVotes(voteMap)
    }
    const { data: allVotes } = await supabase.from('poll_votes').select('poll_id, option_index').in('poll_id', (pollData || []).map(p => p.id))
    const countsMap = {}
    allVotes?.forEach(v => {
      if (!countsMap[v.poll_id]) countsMap[v.poll_id] = {}
      countsMap[v.poll_id][v.option_index] = (countsMap[v.poll_id][v.option_index] || 0) + 1
    })
    setPolls(prev => prev.map(p => ({ ...p, voteCounts: countsMap[p.id] || {} })))
  }

  async function sendDM() {
    if (!content.trim() || !selectedDM || !user) return
    const { data } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selectedDM, content: content.trim() }).select().single()
    if (data) {
      setMessages(prev => [...prev, data])
      setContent('')
      if (!threads.includes(selectedDM)) setThreads(prev => [...prev, selectedDM])
      await supabase.from('notifications').insert({ user_id: selectedDM, from_id: user.id, type: 'message' })
    }
  }

  async function sendGroupMessage() {
    if (!content.trim() || !selectedGroup || !user) return
    const { data } = await supabase.from('group_messages').insert({ group_id: selectedGroup, sender_id: user.id, content: content.trim() }).select('*, profiles(id, username, full_name, avatar_url)').single()
    if (data) { setMessages(prev => [...prev, data]); setContent('') }
  }

  async function uploadFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('chat-files').upload(path, file, { upsert: true })
    if (error) { alert('アップロードエラー: ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(path)
    const fileType = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file'
    if (selectedDM) {
      const { data } = await supabase.from('messages').insert({
        sender_id: user.id, receiver_id: selectedDM,
        content: file.name, file_url: publicUrl, file_type: fileType, file_name: file.name
      }).select().single()
      if (data) {
        setMessages(prev => [...prev, data])
        await supabase.from('notifications').insert({ user_id: selectedDM, from_id: user.id, type: 'message' })
      }
    } else if (selectedGroup) {
      const { data } = await supabase.from('group_messages').insert({
        group_id: selectedGroup, sender_id: user.id,
        content: file.name, file_url: publicUrl, file_type: fileType, file_name: file.name
      }).select('*, profiles(id, username, full_name, avatar_url)').single()
      if (data) setMessages(prev => [...prev, data])
    }
    setUploading(false)
    e.target.value = ''
  }

  async function createPoll() {
    const validOptions = pollOptions.filter(o => o.trim())
    if (!pollQuestion.trim()) { alert('質問を入力してください'); return }
    if (validOptions.length < 2) { alert('選択肢を2つ以上入力してください'); return }
    await supabase.from('polls').insert({ group_id: selectedGroup, created_by: user.id, question: pollQuestion, options: validOptions })
    setPollQuestion(''); setPollOptions(['', '']); setShowPoll(false)
    await getPolls(selectedGroup)
  }

  async function vote(pollId, optionIndex) {
    const existing = myVotes[pollId]
    if (existing !== undefined) {
      await supabase.from('poll_votes').update({ option_index: optionIndex }).eq('poll_id', pollId).eq('user_id', user.id)
    } else {
      await supabase.from('poll_votes').insert({ poll_id: pollId, user_id: user.id, option_index: optionIndex })
    }
    setMyVotes(prev => ({ ...prev, [pollId]: optionIndex }))
    await getPolls(selectedGroup)
  }

  async function createGroup() {
    if (!groupName.trim()) { alert('グループ名を入力してください'); return }
    if (selectedMembers.length === 0) { alert('メンバーを選択してください'); return }
    const { data: group } = await supabase.from('groups').insert({ name: groupName, created_by: user.id }).select().single()
    if (!group) return
    const members = [user.id, ...selectedMembers].map(uid => ({ group_id: group.id, user_id: uid }))
    await supabase.from('group_members').insert(members)
    setGroupName(''); setSelectedMembers([]); setShowNewGroup(false)
    await getGroups(user.id)
    setSelectedGroup(group.id); setTab('group')
  }

  function getName(id) {
    const p = profiles[id]
    if (!p) return '...'
    return p.is_company ? p.company_name : p.full_name || p.username || '名無し'
  }

  function getGroupName(id) { return groups.find(g => g.id === id)?.name || 'グループ' }
  function formatTime(ts) { const d = new Date(ts); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` }

  const accent = isCompany ? '#1a3a5c' : '#1D9E75'
  const bg = isCompany ? '#f0f2f5' : '#f5f4f0'
  const msgBg = isCompany ? '#1a3a5c' : '#1D9E75'

  function Avatar({ profile, size = 36, onClick }) {
    const n = profile?.full_name || profile?.username || '?'
    return (
      <div onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: '600', color: '#0F6E56', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default' }}>
        {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : n[0]}
      </div>
    )
  }

  function FileMessage({ msg }) {
    if (!msg.file_url) return <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{msg.content}</div>
    const isMe = msg.sender_id === user?.id
    if (msg.file_type === 'image') {
      return <img src={msg.file_url} alt={msg.file_name} style={{ maxWidth: '200px', borderRadius: '8px', display: 'block', cursor: 'pointer' }} onClick={() => window.open(msg.file_url, '_blank')} />
    }
    return (
      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: isMe ? '#fff' : '#1a1a18' }}>
        <span style={{ fontSize: '20px' }}>{msg.file_type === 'pdf' ? '📄' : '📎'}</span>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600' }}>{msg.file_name}</div>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>タップして開く</div>
        </div>
      </a>
    )
  }

  function PollCard({ poll }) {
    const options = poll.options || []
    const voteCounts = poll.voteCounts || {}
    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0)
    const myVote = myVotes[poll.id]
    const hasVoted = myVote !== undefined
    return (
      <div style={{ background: '#f0eeea', borderRadius: '12px', padding: '14px', margin: '8px 0' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px' }}>📊 {poll.question}</div>
        {options.map((opt, i) => {
          const count = voteCounts[i] || 0
          const pct = totalVotes > 0 ? Math.round(count / totalVotes * 100) : 0
          const isMyVote = myVote === i
          return (
            <div key={i} onClick={() => vote(poll.id, i)} style={{ marginBottom: '8px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '12px', fontWeight: isMyVote ? '700' : '400', color: isMyVote ? accent : '#1a1a18' }}>{isMyVote ? '✓ ' : ''}{opt}</span>
                {hasVoted && <span style={{ fontSize: '11px', color: '#6b6b67' }}>{pct}% ({count}票)</span>}
              </div>
              <div style={{ height: '6px', background: '#d0cec8', borderRadius: '3px', overflow: 'hidden' }}>
                {hasVoted && <div style={{ height: '100%', width: `${pct}%`, background: isMyVote ? accent : '#888780', borderRadius: '3px', transition: 'width 0.3s' }} />}
              </div>
            </div>
          )
        })}
        <div style={{ fontSize: '11px', color: '#a0a09c', marginTop: '6px' }}>{hasVoted ? `合計 ${totalVotes}票` : 'タップして投票'}</div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'system-ui, sans-serif' }}>
      {isCompany ? <CompanyNavbar /> : <Navbar />}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '12px', height: 'calc(100vh - 120px)' }}>

          {/* 左サイドバー */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
              {[{ key: 'dm', label: 'DM' }, { key: 'group', label: 'グループ' }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: tab === t.key ? '700' : '400', color: tab === t.key ? '#1a1a18' : '#6b6b67', background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab === t.key ? `2px solid ${accent}` : '2px solid transparent' }}>{t.label}</button>
              ))}
            </div>

            {tab === 'dm' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {threads.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>まだメッセージがありません</div>
                ) : threads.map(id => (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', background: selectedDM === id ? (isCompany ? '#eef2f7' : '#f0eeea') : '#fff' }}>
                    <Avatar profile={profiles[id]} onClick={() => router.push(`/profile/${id}`)} />
                    <div onClick={() => { setSelectedDM(id); setSelectedGroup(null) }} style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a18', flex: 1, cursor: 'pointer' }}>{getName(id)}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'group' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => setShowNewGroup(true)} style={{ margin: '10px', padding: '8px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: accent, color: '#fff', border: 'none', cursor: 'pointer' }}>＋ 新しいグループ</button>
                {groups.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a09c', fontSize: '13px' }}>グループがありません</div>
                ) : groups.map(g => (
                  <div key={g.id} onClick={() => { setSelectedGroup(g.id); setSelectedDM(null) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', cursor: 'pointer', background: selectedGroup === g.id ? (isCompany ? '#eef2f7' : '#f0eeea') : '#fff' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>👥</div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a18' }}>{g.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* チャット画面 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {(!selectedDM && !selectedGroup) ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a09c', fontSize: '13px' }}>相手またはグループを選んでください</div>
            ) : (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '8px', background: isCompany ? '#f8f9fb' : '#fff' }}>
                  {selectedDM ? (
                    <>
                      <Avatar profile={profiles[selectedDM]} size={28} onClick={() => router.push(`/profile/${selectedDM}`)} />
                      <div onClick={() => router.push(`/profile/${selectedDM}`)} style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18', cursor: 'pointer' }}>{getName(selectedDM)}</div>
                      {isCompany && profiles[selectedDM] && (
                        <span style={{ fontSize: '10px', background: '#eef2f7', color: '#1a3a5c', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>
                          {profiles[selectedDM]?.is_company ? '法人' : '個人'}
                        </span>
                      )}
                    </>
                  ) : (
                    <><div style={{ fontSize: '18px' }}>👥</div><div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{getGroupName(selectedGroup)}</div></>
                  )}
                  {selectedGroup && (
                    <button onClick={() => setShowPoll(true)} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: isCompany ? '#eef2f7' : '#f0eeea', color: '#1a1a18', border: 'none', cursor: 'pointer' }}>📊 投票を作成</button>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedGroup && polls.map(poll => <PollCard key={poll.id} poll={poll} />)}
                  {messages.map(m => {
                    const isMe = m.sender_id === user?.id
                    const senderProfile = m.profiles
                    return (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        {selectedGroup && !isMe && senderProfile && (
                          <div onClick={() => router.push(`/profile/${senderProfile.id}`)} style={{ fontSize: '11px', color: '#a0a09c', marginBottom: '3px', paddingLeft: '4px', cursor: 'pointer' }}>{senderProfile.full_name || senderProfile.username}</div>
                        )}
                        <div style={{ maxWidth: '75%', padding: m.file_type === 'image' ? '4px' : '8px 12px', borderRadius: isMe ? '12px 12px 2px 12px' : '2px 12px 12px 12px', background: isMe ? msgBg : (isCompany ? '#f0f2f5' : '#f0eeea'), color: isMe ? '#fff' : '#1a1a18' }}>
                          <FileMessage msg={m} />
                        </div>
                        <div style={{ fontSize: '10px', color: '#a0a09c', marginTop: '3px' }}>{formatTime(m.created_at)}</div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                {showPoll && selectedGroup && (
                  <div style={{ padding: '12px 14px', borderTop: '0.5px solid rgba(0,0,0,0.08)', background: '#f8f7f4' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#1a1a18' }}>📊 投票を作成</div>
                    <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="質問を入力..."
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box' }} />
                    {pollOptions.map((opt, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <input value={opt} onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o) }}
                          placeholder={`選択肢 ${i + 1}`}
                          style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none' }} />
                        {pollOptions.length > 2 && (
                          <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#c04020', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                        )}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button onClick={() => setPollOptions(prev => [...prev, ''])} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#6b6b67' }}>＋ 選択肢を追加</button>
                      <button onClick={() => { setShowPoll(false); setPollQuestion(''); setPollOptions(['', '']) }} style={{ padding: '6px 12px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#6b6b67' }}>キャンセル</button>
                      <button onClick={createPoll} style={{ padding: '6px 16px', borderRadius: '8px', background: accent, color: '#fff', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>作成</button>
                    </div>
                  </div>
                )}

                <div style={{ padding: '10px 14px', borderTop: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', gap: '8px', alignItems: 'center', background: isCompany ? '#f8f9fb' : '#fff' }}>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: '34px', height: '34px', borderRadius: '50%', background: isCompany ? '#eef2f7' : '#f0eeea', border: 'none', fontSize: '16px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {uploading ? '⏳' : '📎'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf,.zip,.doc,.docx,.xls,.xlsx,.pptx" onChange={uploadFile} style={{ display: 'none' }} />
                  <input value={content} onChange={e => setContent(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (selectedDM ? sendDM() : sendGroupMessage())}
                    placeholder="メッセージを入力... (Enterで送信)"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', background: isCompany ? '#f0f2f5' : '#f5f4f0' }}
                  />
                  <button onClick={selectedDM ? sendDM : sendGroupMessage} style={{ width: '34px', height: '34px', borderRadius: '50%', background: msgBg, color: '#fff', border: 'none', fontSize: '16px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showNewGroup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setShowNewGroup(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '1rem' }}>新しいグループを作成</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }}>グループ名</label>
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="例：プロジェクトチームA"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '8px' }}>メンバーを選択（フォロワーから）</label>
              {followers.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#a0a09c' }}>フォロワーがいません</div>
              ) : followers.map(f => (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedMembers.includes(f.id)} onChange={e => { if (e.target.checked) setSelectedMembers(prev => [...prev, f.id]); else setSelectedMembers(prev => prev.filter(id => id !== f.id)) }} />
                  <Avatar profile={f} size={28} />
                  <span style={{ fontSize: '13px', color: '#1a1a18' }}>{f.full_name || f.username}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowNewGroup(false)} style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: 'none', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={createGroup} style={{ padding: '8px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: accent, color: '#fff', border: 'none', cursor: 'pointer' }}>作成する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#6b6b67' }}>読み込み中...</div></div>}>
      <MessagesContent />
    </Suspense>
  )
}