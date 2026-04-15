'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import CompanyNavbar from '../../../components/CompanyNavbar'

export default function CompanyPlanPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!data?.is_company) { router.push('/'); return }
    setProfile(data)
    setLoading(false)
  }

  async function handleUpgrade(priceEnvKey) {
    setUpgrading(priceEnvKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: priceEnvKey === 'standard'
            ? process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID
            : process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
          userId: profile.id,
          email: (await supabase.auth.getUser()).data.user?.email
        })
      })
      const { url, error } = await res.json()
      if (error) { alert('エラー: ' + error); return }
      window.location.href = url
    } catch (err) {
      alert('エラーが発生しました')
    } finally {
      setUpgrading('')
    }
  }

  async function handlePortal() {
    if (!profile?.stripe_customer_id) { alert('有効なサブスクリプションがありません'); return }
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: profile.stripe_customer_id })
    })
    const { url } = await res.json()
    window.location.href = url
  }

  const PLANS = [
    {
      key: 'free',
      name: 'フリー',
      price: '無料',
      color: '#6b6b67',
      bg: '#f5f4f0',
      features: ['月5件までスカウト送信', 'アイデア閲覧無制限', '基本メッセージ機能'],
      limit: '月5件'
    },
    {
      key: 'standard',
      name: 'スタンダード',
      price: '¥20,000/月',
      color: '#1D9E75',
      bg: '#E1F5EE',
      features: ['月30件スカウト送信', 'アイデア閲覧無制限', '優先表示', 'スカウト分析'],
      limit: '月30件',
      recommended: true
    },
    {
      key: 'enterprise',
      name: 'エンタープライズ',
      price: '¥100,000/月',
      color: '#1a3a5c',
      bg: '#eef2f7',
      features: ['スカウト送信無制限', 'アイデア閲覧無制限', '専任サポート', '独自タグ検索', 'API連携'],
      limit: '無制限'
    }
  ]

  const currentPlan = profile?.subscription_plan || 'free'
  const scoutCount = profile?.scout_count_this_month || 0
  const scoutLimit = profile?.scout_limit || 5

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>
      <CompanyNavbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a18', marginBottom: '6px' }}>プラン管理</h1>
        <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '1.5rem' }}>現在のプランと使用状況を確認できます</div>

        {/* 使用状況 */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.08)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '12px' }}>今月の使用状況</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '12px' }}>
            <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a5c' }}>{scoutCount}</div>
              <div style={{ fontSize: '11px', color: '#6b6b67', marginTop: '2px' }}>スカウト送信済み</div>
            </div>
            <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1D9E75' }}>{scoutLimit - scoutCount < 0 ? 0 : scoutLimit - scoutCount}</div>
              <div style={{ fontSize: '11px', color: '#6b6b67', marginTop: '2px' }}>残り送信可能数</div>
            </div>
            <div style={{ background: '#f5f4f0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a18' }}>{scoutLimit === 9999 ? '∞' : scoutLimit}</div>
              <div style={{ fontSize: '11px', color: '#6b6b67', marginTop: '2px' }}>月間上限</div>
            </div>
          </div>

          {/* プログレスバー */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ fontSize: '11px', color: '#6b6b67' }}>スカウト使用率</div>
              <div style={{ fontSize: '11px', color: '#6b6b67' }}>{scoutLimit === 9999 ? '無制限' : `${scoutCount} / ${scoutLimit}件`}</div>
            </div>
            <div style={{ height: '8px', background: '#f0eeea', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px', transition: 'width 0.3s',
                width: scoutLimit === 9999 ? '10%' : `${Math.min(scoutCount / scoutLimit * 100, 100)}%`,
                background: scoutCount >= scoutLimit ? '#E24B4A' : '#1D9E75'
              }} />
            </div>
          </div>
        </div>

        {/* プラン一覧 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '12px', marginBottom: '1.5rem' }}>
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.key
            return (
              <div key={plan.key} style={{
                background: '#fff', borderRadius: '14px',
                border: isCurrent ? `2px solid ${plan.color}` : '0.5px solid rgba(0,0,0,0.08)',
                padding: '1.25rem', position: 'relative'
              }}>
                {plan.recommended && !isCurrent && (
                  <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#1D9E75', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>おすすめ</div>
                )}
                {isCurrent && (
                  <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>現在のプラン</div>
                )}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '4px' }}>{plan.name}</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: plan.color }}>{plan.price}</div>
                  <div style={{ fontSize: '11px', color: '#6b6b67', marginTop: '2px' }}>スカウト {plan.limit}</div>
                </div>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ color: plan.color, fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.5' }}>{f}</span>
                  </div>
                ))}
                <div style={{ marginTop: '14px' }}>
                  {isCurrent ? (
                    <div style={{ textAlign: 'center', padding: '9px', background: plan.bg, borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: plan.color }}>ご利用中</div>
                  ) : plan.key === 'free' ? (
                    <div style={{ textAlign: 'center', padding: '9px', background: '#f5f4f0', borderRadius: '10px', fontSize: '12px', color: '#a0a09c' }}>ダウングレード</div>
                  ) : (
                    <button onClick={() => handleUpgrade(plan.key)} disabled={upgrading === plan.key} style={{
                      width: '100%', padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                      background: plan.color, color: '#fff', border: 'none',
                      cursor: upgrading === plan.key ? 'not-allowed' : 'pointer',
                      opacity: upgrading === plan.key ? 0.7 : 1
                    }}>{upgrading === plan.key ? '処理中...' : 'アップグレード'}</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 成功手数料の説明 */}
        <div style={{ background: '#eef2f7', borderRadius: '14px', border: '0.5px solid rgba(26,58,92,0.15)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>💼</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '6px' }}>スカウト成功手数料について</div>
              <div style={{ fontSize: '13px', color: '#1a3a5c', lineHeight: '1.8' }}>
                スカウトが承諾され、双方がビジネス合意に至った場合、3,000円の成功手数料が発生します。
                これはスカウト管理ページの「合意を報告する」ボタンから申告してください。
                月額プランに関わらず全ユーザー対象です。
              </div>
            </div>
          </div>
        </div>

        {/* サブスク管理 */}
        {profile?.stripe_customer_id && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.08)', padding: '1.25rem' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px' }}>サブスクリプション管理</div>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '12px' }}>支払い方法の変更・解約はStripeのカスタマーポータルから行えます。</div>
            <button onClick={handlePortal} style={{
              padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
              background: '#1a3a5c', color: '#fff', border: 'none', cursor: 'pointer'
            }}>支払い・解約管理を開く →</button>
          </div>
        )}
      </div>
    </div>
  )
}
