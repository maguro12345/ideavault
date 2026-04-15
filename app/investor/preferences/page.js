 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/Navbar'

export default function InvestorPreferencesPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({
    min_amount: '',
    max_amount: '',
    industries: [],
    regions: [],
    stages: []
  })
  const router = useRouter()
  const supabase = createClient()

  const INDUSTRIES = ['AI・機械学習', 'SaaS', 'フィンテック', 'ヘルスケア・医療', 'フードテック', 'エドテック・教育', 'モビリティ・交通', 'エンタメ・メディア', '環境・サステナビリティ', 'ブロックチェーン・Web3', 'その他']
  const REGIONS = ['東京', '大阪', '福岡', '名古屋', '北海道', '東北', '関東', '中部', '関西', '中国・四国', '九州・沖縄', '海外']
  const STAGES = ['アイデア段階', '検証中', 'MVP開発', 'ベータ版', 'ローンチ済み', '成長期']

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data } = await supabase.from('investor_preferences').select('*').eq('user_id', user.id).single()
    if (data) {
      setPrefs({
        min_amount: data.min_amount || '',
        max_amount: data.max_amount || '',
        industries: data.industries || [],
        regions: data.regions || [],
        stages: data.stages || []
      })
    }
    setLoading(false)
  }

  function toggle(key, value) {
    setPrefs(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value]
    }))
  }

  async function save() {
    setSaving(true)
    await supabase.from('investor_preferences').upsert({
      user_id: user.id,
      min_amount: prefs.min_amount ? parseInt(prefs.min_amount) : null,
      max_amount: prefs.max_amount ? parseInt(prefs.max_amount) : null,
      industries: prefs.industries,
      regions: prefs.regions,
      stages: prefs.stages,
      updated_at: new Date().toISOString()
    })
    setSaving(false)
    alert('保存しました')
  }

  const chipStyle = (selected) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
    border: `1px solid ${selected ? '#1D9E75' : 'rgba(0,0,0,0.15)'}`,
    background: selected ? '#E1F5EE' : '#fff',
    color: selected ? '#0d6e50' : '#6b6b67'
  })

  const sectionTitle = (t) => (
    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.7px', paddingBottom: '10px', marginBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{t}</div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a18', marginBottom: '6px' }}>投資スクリーニング設定</h1>
        <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.5rem' }}>条件に合うアイデアをフィルタリングできます</div>

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
          {sectionTitle('投資金額レンジ')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '6px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b6b67', fontWeight: '600', marginBottom: '5px' }}>最小金額（万円）</label>
              <input type="number" value={prefs.min_amount} onChange={e => setPrefs({ ...prefs, min_amount: e.target.value })} placeholder="例：100"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#6b6b67', fontWeight: '600', marginBottom: '5px' }}>最大金額（万円）</label>
              <input type="number" value={prefs.max_amount} onChange={e => setPrefs({ ...prefs, max_amount: e.target.value })} placeholder="例：5000"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
          {sectionTitle('対象業界')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {INDUSTRIES.map(i => (
              <button key={i} type="button" onClick={() => toggle('industries', i)} style={chipStyle(prefs.industries.includes(i))}>{i}</button>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '12px' }}>
          {sectionTitle('対象地域')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {REGIONS.map(r => (
              <button key={r} type="button" onClick={() => toggle('regions', r)} style={chipStyle(prefs.regions.includes(r))}>{r}</button>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          {sectionTitle('投資対象ステージ')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {STAGES.map(s => (
              <button key={s} type="button" onClick={() => toggle('stages', s)} style={chipStyle(prefs.stages.includes(s))}>{s}</button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving} style={{ width: '100%', padding: '12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? '保存中...' : '設定を保存する'}
        </button>
      </div>
    </div>
  )
}
