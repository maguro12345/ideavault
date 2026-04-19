'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

export default function CofounderPage() {
  const [user, setUser] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [myProfile, setMyProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({
    role_seeking: '', role_offering: '', skills: '',
    idea_stage: 'アイデア段階', idea_description: '',
    commitment: 'フルタイム', location: '', remote_ok: true
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data: my } = await supabase.from('cofounder_profiles').select('*').eq('user_id', user.id).single()
      if (my) {
        setMyProfile(my)
        setForm({
          role_seeking: my.role_seeking || '',
          role_offering: my.role_offering || '',
          skills: my.skills || '',
          idea_stage: my.idea_stage || 'アイデア段階',
          idea_description: my.idea_description || '',
          commitment: my.commitment || 'フルタイム',
          location: my.location || '',
          remote_ok: my.remote_ok !== false
        })
      }
    }
    await fetchProfiles(user?.id)
    setLoading(false)
  }

  async function fetchProfiles(userId) {
    let q = supabase.from('cofounder_profiles')
      .select('*, profiles(id, full_name, username, avatar_url, bio, location, tags, is_verified)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (userId) q = q.neq('user_id', userId)
    const { data } = await q
    setProfiles(data || [])
  }

  async function saveProfile() {
    if (!form.role_seeking.trim()) { alert('求めているロールを入力してください'); return }
    if (!form.role_offering.trim()) { alert('提供できるロールを入力してください'); return }
    setSaving(true)
    await supabase.from('cofounder_profiles').upsert({ user_id: user.id, ...form, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    const { data: my } = await supabase.from('cofounder_profiles').select('*').eq('user_id', user.id).single()
    setMyProfile(my)
    setShowForm(false)
    setSaving(false)
    await fetchProfiles(user.id)
  }

  async function toggleActive() {
    await supabase.from('cofounder_profiles').update({ is_active: !myProfile.is_active }).eq('user_id', user.id)
    const { data: my } = await supabase.from('cofounder_profiles').select('*').eq('user_id', user.id).single()
    setMyProfile(my)
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }

  const ROLES = ['エンジニア（フロント）', 'エンジニア（バック）', 'フルスタックエンジニア', 'デザイナー', 'マーケター', '営業・BD', 'ファイナンス・CFO', 'プロダクトマネージャー', '起業家・ビジョナリー', 'ドメイン専門家', 'その他']

  const filtered = profiles.filter(p => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return p.role_seeking?.toLowerCase().includes(q) ||
           p.role_offering?.toLowerCase().includes(q) ||
           p.skills?.toLowerCase().includes(q) ||
           p.profiles?.full_name?.toLowerCase().includes(q)
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>🤝 共同創業者を探す</h1>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginTop: '4px' }}>一緒に事業を立ち上げる仲間を見つけよう</div>
          </div>
          {user && (
            <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: myProfile ? '#fff' : '#1D9E75', color: myProfile ? '#1a1a18' : '#fff', border: myProfile ? '1px solid rgba(0,0,0,0.2)' : 'none', cursor: 'pointer' }}>
              {myProfile ? '✏️ プロフィールを編集' : '＋ 掲載する'}
            </button>
          )}
        </div>

        {/* 自分のプロフィール状態 */}
        {myProfile && (
          <div style={{ background: '#E1F5EE', borderRadius: '12px', border: '1px solid #1D9E75', padding: '12px 16px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: '#0d6e50', fontWeight: '600' }}>
              {myProfile.is_active ? '✅ あなたのプロフィールは掲載中です' : '⏸ あなたのプロフィールは非表示中です'}
            </div>
            <button onClick={toggleActive} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: '#fff', color: '#0d6e50', border: '1px solid #1D9E75', cursor: 'pointer' }}>
              {myProfile.is_active ? '非表示にする' : '掲載再開'}
            </button>
          </div>
        )}

        {/* 掲載フォーム */}
        {showForm && user && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1.5px solid #1D9E75', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '1.25rem' }}>共同創業者プロフィール</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>求めているロール <span style={{ color: '#c04020' }}>*</span></label>
                <select value={form.role_seeking} onChange={e => setForm({ ...form, role_seeking: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                  <option value="">選択してください</option>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>自分が提供できるロール <span style={{ color: '#c04020' }}>*</span></label>
                <select value={form.role_offering} onChange={e => setForm({ ...form, role_offering: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                  <option value="">選択してください</option>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>スキル・経験（カンマ区切り）</label>
              <input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="例：React, Python, マーケティング, 資金調達" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>アイデアのステージ</label>
                <select value={form.idea_stage} onChange={e => setForm({ ...form, idea_stage: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                  {['アイデア段階', 'プロトタイプあり', 'ユーザーあり', '収益あり', '未定'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>コミット度</label>
                <select value={form.commitment} onChange={e => setForm({ ...form, commitment: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                  {['フルタイム', '副業・週末', '週10〜20時間', 'フレキシブル'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>アイデア・やりたいこと</label>
              <textarea value={form.idea_description} onChange={e => setForm({ ...form, idea_description: e.target.value })}
                placeholder="どんな事業をやりたいか、どんなパートナーを探しているか" rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginBottom: '1.25rem' }}>
              <div>
                <label style={labelStyle}>所在地</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="例：東京都" style={inputStyle} />
              </div>
              <div style={{ paddingTop: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b6b67', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={form.remote_ok} onChange={e => setForm({ ...form, remote_ok: e.target.checked })} />
                  リモートOK
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13px', border: '0.5px solid rgba(0,0,0,0.15)', color: '#6b6b67', background: '#fff', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={saveProfile} disabled={saving} style={{ padding: '9px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '保存中...' : '掲載する'}</button>
            </div>
          </div>
        )}

        {/* フィルター */}
        <div style={{ marginBottom: '1rem' }}>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="🔍 ロール・スキルで絞り込む..."
            style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
        </div>

        {/* 一覧 */}
        {!user && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '6px' }}>ログインすると詳細を確認・メッセージを送れます</div>
            <a href="/login" style={{ display: 'inline-block', padding: '9px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', textDecoration: 'none' }}>ログイン・登録</a>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🤝</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' }}>まだ掲載者がいません</div>
            <div style={{ fontSize: '13px', color: '#6b6b67' }}>最初に掲載してみましょう！</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(cf => {
              const p = cf.profiles
              const name = p?.full_name || p?.username || '名無し'
              return (
                <div key={cf.id} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div onClick={() => router.push(`/profile/${p?.id}`)} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#0F6E56', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
                      {p?.avatar_url ? <img src={p.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', cursor: 'pointer' }} onClick={() => router.push(`/profile/${p?.id}`)}>{name}</div>
                        {p?.is_verified && <span style={{ fontSize: '10px', background: '#d8f2ea', color: '#0d6e50', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>✅ 認証済み</span>}
                        {cf.remote_ok && <span style={{ fontSize: '10px', background: '#eef2f7', color: '#1a3a5c', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>🌐 リモートOK</span>}
                      </div>
                      {p?.bio && <div style={{ fontSize: '12px', color: '#6b6b67', marginBottom: '6px' }}>{p.bio}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '10px', color: '#a0a09c', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase' }}>求めるロール</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{cf.role_seeking}</div>
                    </div>
                    <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '10px', color: '#a0a09c', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase' }}>提供できるロール</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{cf.role_offering}</div>
                    </div>
                  </div>

                  {cf.idea_description && (
                    <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.6', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cf.idea_description}</div>
                  )}

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {cf.skills && cf.skills.split(',').slice(0, 4).map(s => s.trim()).filter(Boolean).map(s => (
                      <span key={s} style={{ fontSize: '11px', background: '#E1F5EE', color: '#0d6e50', padding: '2px 8px', borderRadius: '20px' }}>{s}</span>
                    ))}
                    <span style={{ fontSize: '11px', background: '#f0eeea', color: '#6b6b67', padding: '2px 8px', borderRadius: '20px' }}>{cf.commitment}</span>
                    {cf.idea_stage && <span style={{ fontSize: '11px', background: '#fdecd4', color: '#8a4f0a', padding: '2px 8px', borderRadius: '20px' }}>{cf.idea_stage}</span>}
                    {cf.location && <span style={{ fontSize: '11px', color: '#a0a09c' }}>📍 {cf.location}</span>}
                  </div>

                  {user && p?.id !== user?.id && (
                    <button onClick={() => router.push(`/messages?to=${p?.id}`)} style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      💬 メッセージを送る
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}