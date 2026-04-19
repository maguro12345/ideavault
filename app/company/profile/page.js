'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CompanyNavbar from '../../../components/CompanyNavbar'

export default function CompanyProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [form, setForm] = useState({
    company_name: '', company_type: '企業', industry: '',
    contact_name: '', company_description: '', location: '', tags: '',
    // 投資家用
    investment_stage: '', investment_size: '', investment_focus: '',
    // アドバイザー用
    advisor_role: '', advisor_specialty: '', advisor_experience: ''
  })
  const fileInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!data?.is_company) { router.push('/'); return }
    setProfile(data)
    setForm({
      company_name: data.company_name || '',
      company_type: data.company_type || '企業',
      industry: data.industry || '',
      contact_name: data.contact_name || data.full_name || '',
      company_description: data.company_description || data.bio || '',
      location: data.location || '',
      tags: (data.tags || []).join(', '),
      investment_stage: data.investment_stage || '',
      investment_size: data.investment_size || '',
      investment_focus: data.investment_focus || '',
      advisor_role: data.advisor_role || '',
      advisor_specialty: data.advisor_specialty || '',
      advisor_experience: data.advisor_experience || ''
    })
    setLoading(false)
  }

  async function uploadAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatar_${user.id}.${ext}`
    await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
    setAvatarUploading(false)
  }

  async function uploadBanner(e) {
    const file = e.target.files[0]
    if (!file) return
    setBannerUploading(true)
    const ext = file.name.split('.').pop()
    const path = `banner_${user.id}.${ext}`
    await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ banner_url: publicUrl }).eq('id', user.id)
    setProfile(prev => ({ ...prev, banner_url: publicUrl }))
    setBannerUploading(false)
  }

  async function saveProfile() {
    setSaving(true)
    const updates = {
      company_name: form.company_name,
      company_type: form.company_type,
      industry: form.industry,
      contact_name: form.contact_name,
      full_name: form.contact_name,
      company_description: form.company_description,
      bio: form.company_description,
      location: form.location,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    }
    if (form.company_type === '投資家') {
      updates.investment_stage = form.investment_stage
      updates.investment_size = form.investment_size
      updates.investment_focus = form.investment_focus
    }
    if (form.company_type === 'アドバイザー') {
      updates.advisor_role = form.advisor_role
      updates.advisor_specialty = form.advisor_specialty
      updates.advisor_experience = form.advisor_experience
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (error) { alert('エラー: ' + error.message); setSaving(false); return }
    setSaving(false)
    alert('保存しました')
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) { setPasswordMsg('6文字以上で入力してください'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPasswordMsg('エラー: ' + error.message); return }
    setPasswordMsg('パスワードを変更しました')
    setNewPassword('')
    setTimeout(() => setPasswordMsg(''), 3000)
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '5px' }
  const sectionTitle = (title) => (
    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1a3a5c', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{title}</div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  const name = profile?.company_name || profile?.full_name || '企業'
  const typeLabel = form.company_type === '投資家' ? '投資家' : form.company_type === 'アドバイザー' ? 'アドバイザー' : '法人'

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      <CompanyNavbar />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>{typeLabel}プロフィール設定</h1>

        {/* バナー・アバター */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', marginBottom: '12px', overflow: 'hidden' }}>
          <div onClick={() => bannerInputRef.current?.click()} style={{ height: '100px', cursor: 'pointer', position: 'relative', background: profile?.banner_url ? `url(${profile.banner_url}) center/cover` : '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {bannerUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: '13px' }}>アップロード中...</span></div>}
            <div style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '20px' }}>📷 バナーを変更</div>
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={uploadBanner} style={{ display: 'none' }} />
          </div>
          <div style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'flex-end', gap: '12px', marginTop: '-28px', marginBottom: '12px' }}>
            <div onClick={() => fileInputRef.current?.click()} style={{ width: '60px', height: '60px', borderRadius: '12px', border: '3px solid #fff', overflow: 'hidden', background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px' }}>{form.company_type === 'アドバイザー' ? '🎓' : form.company_type === '投資家' ? '💰' : '🏢'}</span>}
              {avatarUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: '10px' }}>...</span></div>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18' }}>{name}</div>
              <div style={{ fontSize: '12px', color: '#6b6b67' }}>{form.company_type} · {form.industry || form.advisor_role || ''}</div>
            </div>
          </div>
        </div>

        {/* アカウント種別 */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
          {sectionTitle('アカウント種別')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '6px' }}>
            {['企業', '投資家', 'アドバイザー'].map(type => (
              <button key={type} type="button" onClick={() => setForm({ ...form, company_type: type })} style={{
                padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
                border: `1.5px solid ${form.company_type === type ? '#1a3a5c' : 'rgba(0,0,0,0.1)'}`,
                background: form.company_type === type ? '#eef2f7' : '#fff',
                color: form.company_type === type ? '#1a3a5c' : '#6b6b67', cursor: 'pointer'
              }}>
                {type === '企業' ? '🏢 ' : type === '投資家' ? '💰 ' : '🎓 '}{type}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#a0a09c', marginTop: '6px' }}>
            {form.company_type === '企業' && '法人としてアイデアを募集・スカウトできます'}
            {form.company_type === '投資家' && '投資家としてスタートアップにアクセスできます'}
            {form.company_type === 'アドバイザー' && '専門家としてアドバイスや動画配信ができます'}
          </div>
        </div>

        {/* 企業プロフィール */}
        {form.company_type === '企業' && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
            {sectionTitle('企業情報')}
            {[
              { label: '会社名・屋号', key: 'company_name', placeholder: '例：株式会社〇〇' },
              { label: '業種', key: 'industry', placeholder: '例：IT・フードテック・ヘルスケア' },
              { label: '担当者名', key: 'contact_name', placeholder: '例：田中 誠' },
              { label: '所在地', key: 'location', placeholder: '例：東京都渋谷区' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>{label}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>事業内容・求めるアイデア</label>
              <textarea value={form.company_description} onChange={e => setForm({ ...form, company_description: e.target.value })}
                placeholder="どんな事業をしているか、どんなアイデアを探しているか" rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>タグ（カンマ区切り）</label>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="例：フードテック, AI, 共同開発" style={inputStyle} />
            </div>
            <button onClick={saveProfile} disabled={saving} style={{ width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '保存中...' : '保存する'}</button>
          </div>
        )}

        {/* 投資家プロフィール */}
        {form.company_type === '投資家' && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
            {sectionTitle('投資家情報')}
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>氏名・ファンド名</label>
              <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="例：〇〇キャピタル / 田中 誠" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>担当者名</label>
              <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="例：田中 誠" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>投資ステージ</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['シード', 'プレA', 'シリーズA', 'シリーズB以降', 'レイター', '全ステージ'].map(s => (
                  <button key={s} type="button" onClick={() => setForm({ ...form, investment_stage: s })} style={{
                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    border: `1px solid ${form.investment_stage === s ? '#1a3a5c' : 'rgba(0,0,0,0.15)'}`,
                    background: form.investment_stage === s ? '#eef2f7' : '#fff',
                    color: form.investment_stage === s ? '#1a3a5c' : '#6b6b67'
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>投資規模</label>
              <input value={form.investment_size} onChange={e => setForm({ ...form, investment_size: e.target.value })} placeholder="例：500万円〜3,000万円" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>投資領域・興味分野</label>
              <input value={form.investment_focus} onChange={e => setForm({ ...form, investment_focus: e.target.value })} placeholder="例：SaaS, フードテック, ヘルスケア" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>所在地</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="例：東京都千代田区" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>自己紹介・投資方針</label>
              <textarea value={form.company_description} onChange={e => setForm({ ...form, company_description: e.target.value })}
                placeholder="どんな起業家・アイデアを求めているか、投資のスタンスなど" rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
            </div>
            <button onClick={saveProfile} disabled={saving} style={{ width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '保存中...' : '保存する'}</button>
          </div>
        )}

        {/* アドバイザープロフィール */}
        {form.company_type === 'アドバイザー' && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
            {sectionTitle('アドバイザー情報')}
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>氏名</label>
              <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value, company_name: e.target.value })} placeholder="例：田中 誠" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>職種・肩書き</label>
              <input value={form.advisor_role} onChange={e => setForm({ ...form, advisor_role: e.target.value, industry: e.target.value })} placeholder="例：大学教員・弁護士・元起業家・経営コンサルタント" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>専門領域</label>
              <input value={form.advisor_specialty} onChange={e => setForm({ ...form, advisor_specialty: e.target.value })} placeholder="例：知的財産・マーケティング・資金調達・組織づくり" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>経歴・実績</label>
              <textarea value={form.advisor_experience} onChange={e => setForm({ ...form, advisor_experience: e.target.value })}
                placeholder="例：〇〇大学教授・元〇〇株式会社CTO・スタートアップ支援100社以上" rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>所在地</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="例：東京都" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>自己紹介・提供できる価値</label>
              <textarea value={form.company_description} onChange={e => setForm({ ...form, company_description: e.target.value })}
                placeholder="どんな相談に乗れるか、起業家へのメッセージなど" rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }} />
            </div>
            <button onClick={saveProfile} disabled={saving} style={{ width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '保存中...' : '保存する'}</button>
          </div>
        )}

        {/* セキュリティ */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
          {sectionTitle('セキュリティ')}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>メールアドレス</label>
            <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: '#6b6b67' }}>{user?.email}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>新しいパスワード</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="6文字以上" style={inputStyle} />
          </div>
          {passwordMsg && <div style={{ fontSize: '13px', color: passwordMsg.includes('エラー') ? '#c04020' : '#0d6e50', marginBottom: '8px' }}>{passwordMsg}</div>}
          <button onClick={changePassword} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#1a1a18', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: '16px' }}>パスワードを変更</button>
          <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b6b67', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>アクセス管理</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/settings/sessions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.1)', textDecoration: 'none', background: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f4f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🖥️</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>セッション管理</div>
                    <div style={{ fontSize: '11px', color: '#6b6b67' }}>ログイン中の端末一覧・強制ログアウト</div>
                  </div>
                </div>
                <span style={{ fontSize: '14px', color: '#a0a09c' }}>→</span>
              </Link>
              <Link href="/settings/2fa" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #1a3a5c', textDecoration: 'none', background: '#eef2f7' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🔐</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a5c' }}>2要素認証（2FA）</div>
                      <span style={{ fontSize: '10px', background: '#1a3a5c', color: '#fff', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>推奨</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#1a3a5c' }}>アカウントを保護するため設定を推奨します</div>
                  </div>
                </div>
                <span style={{ fontSize: '14px', color: '#1a3a5c' }}>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}