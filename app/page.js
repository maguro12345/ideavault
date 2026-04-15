'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function Home() {
  const [ideas, setIdeas] = useState([])
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('new')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_company').eq('id', user.id).single()
      if (profile?.is_company) { window.location.href = '/company/dashboard'; return }
    }
    await getIdeas()
    await fetchCategories()
  }

  async function getIdeas() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('ideas')
      .select('*, profiles(id, username, full_name, is_company, company_name, avatar_url, is_private)')
      .order('created_at', { ascending: false })
    if (data) {
      let filtered = data
      if (user) {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
        const followingIds = new Set(follows?.map(f => f.following_id) || [])
        filtered = data.filter(idea => {
          if (!idea.profiles?.is_private) return true
          if (idea.user_id === user.id) return true
          return followingIds.has(idea.user_id)
        })
      } else {
        filtered = data.filter(idea => !idea.profiles?.is_private)
      }
      setIdeas(filtered)
    }
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('name').order('sort_order')
    setCategories(data?.map(c => c.name) || [])
  }

  const filtered = ideas.filter(i => {
    const q = search.toLowerCase()
    if (q && !i.title?.toLowerCase().includes(q) && !i.concept?.toLowerCase().includes(q) && !i.category?.toLowerCase().includes(q)) return false
    if (filterStatus && i.status !== filterStatus) return false
    if (filterCategory && i.category !== filterCategory) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'new') return new Date(b.created_at) - new Date(a.created_at)
    if (sort === 'popular') return (b.view_count || 0) - (a.view_count || 0)
    return 0
  })

  const featured = ideas.slice(0, 3)

  const BADGE = {
    'アイデア':  { bg: '#deeefb', color: '#1255a0' },
    '検討中':    { bg: '#fdecd4', color: '#8a4f0a' },
    '進行中':    { bg: '#d8f2ea', color: '#0d6e50' },
    '完成':      { bg: '#e4f2d8', color: '#376b10' },
    '一時停止':  { bg: '#eeecea', color: '#5a5a56' },
  }

  function IdeaCard({ idea, big = false }) {
    const badge = BADGE[idea.status] || BADGE['アイデア']
    const profile = idea.profiles
    const name = profile?.is_company ? profile.company_name : profile?.full_name || profile?.username || '名無し'
    return (
      <div onClick={() => router.push(`/ideas/${idea.id}`)}
        style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '14px', padding: big ? '1.5rem' : '1.15rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ fontSize: big ? '18px' : '15px', fontWeight: '700', color: '#1a1a18', lineHeight: '1.4' }}>{idea.title}</div>
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0, background: badge.bg, color: badge.color }}>{idea.status}</span>
        </div>
        {idea.concept && (
          <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.65', display: '-webkit-box', WebkitLineClamp: big ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {!user ? idea.concept.slice(0, 80) + '...' : idea.concept}
          </div>
        )}
        {user && idea.revenue && (
          <div style={{ background: '#f0eeea', borderRadius: '8px', padding: '9px 11px' }}>
            <div style={{ fontSize: '10px', color: '#a0a09c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '3px' }}>収益モデル</div>
            <div style={{ fontSize: '12px', color: '#1a1a18', lineHeight: '1.55', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-all' }}>{idea.revenue.split('\n')[0]}</div>
          </div>
        )}
        {!user && (
          <div style={{ background: '#f5f4f0', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b6b67' }}>収益モデル・詳細は</div>
            <Link href="/login" onClick={e => e.stopPropagation()} style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '700', textDecoration: 'none' }}>会員登録後に閲覧できます →</Link>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <div onClick={e => { e.stopPropagation(); router.push(`/profile/${profile?.id}`) }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#0F6E56', overflow: 'hidden', flexShrink: 0 }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
            </div>
            <span style={{ fontSize: '11px', color: '#6b6b67' }}>{name}</span>
          </div>
          {idea.category && <span style={{ fontSize: '11px', background: '#f0eeea', padding: '2px 8px', borderRadius: '20px', color: '#6b6b67' }}>{idea.category.split(', ')[0]}</span>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* ヒーロー */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '16px', padding: '2.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>起業家のためのプラットフォーム</div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.5px', lineHeight: '1.3', color: '#1a1a18' }}>アイデアを、<br />事業に変える場所</h1>
            <p style={{ color: '#6b6b67', fontSize: '14px', marginBottom: '1.5rem', lineHeight: '1.8' }}>
              ビジネスアイデアを投稿して、共同創業者・投資家・企業と出会おう。<br />あなたのアイデアが次の大きな事業になるかもしれない。
            </p>
            {!user ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link href="/login" style={{ background: '#1D9E75', color: '#fff', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>無料でアカウント作成</Link>
                <a href="#feed" style={{ background: 'none', color: '#1a1a18', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', border: '0.5px solid rgba(0,0,0,0.15)' }}>アイデアを見る</a>
              </div>
            ) : (
              <Link href="/ideas/create" style={{ background: '#1D9E75', color: '#fff', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>＋ 新しいアイデアを投稿する</Link>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[{ num: ideas.length, label: '投稿企画数' }, { num: categories.length, label: 'カテゴリ数' }, { num: ideas.filter(i => i.status === '進行中').length, label: '進行中の企画' }].map(({ num, label }) => (
              <div key={label} style={{ background: '#f5f4f0', borderRadius: '12px', padding: '1rem 1.25rem', textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1D9E75' }}>{num}</div>
                <div style={{ fontSize: '11px', color: '#6b6b67', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 未ログイン時：2分岐セクション */}
        {!user && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.75rem' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎓</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' }}>学生・起業家の方へ</div>
              <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.8', marginBottom: '16px' }}>
                アイデアを投稿して可能性を広げよう。投稿したアイデアの知的財産権はあなたに帰属します。タイムスタンプで先願性を証明できます。
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {['アイデアを投稿・公開', '企業・投資家からスカウトを受ける', '公開範囲を自分で設定', 'タイムスタンプで権利を保護'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1a1a18' }}>
                    <span style={{ color: '#1D9E75', fontWeight: '700', flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', background: '#1D9E75', color: '#fff', padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>無料で始める</Link>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid rgba(26,58,92,0.2)', padding: '1.75rem' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏢</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' }}>企業・投資家の方へ</div>
              <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.8', marginBottom: '16px' }}>
                次の事業の種を探そう。アイデア段階から起業家と接触できる唯一のプラットフォームです。スカウトから事業提携まで一気通貫。
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {['アイデアを検索・閲覧', 'スカウトを送って直接接触', 'ビジネスチャットで商談', '月5件まで無料でスカウト'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1a1a18' }}>
                    <span style={{ color: '#1a3a5c', fontWeight: '700', flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/register-company" style={{ display: 'block', textAlign: 'center', background: '#1a3a5c', color: '#fff', padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>法人登録はこちら</Link>
            </div>
          </div>
        )}

        {/* フィード */}
        <div id="feed">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18' }}>すべての企画</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[{ key: 'new', label: '新着' }, { key: 'popular', label: '人気' }].map(s => (
                <button key={s.key} onClick={() => setSort(s.key)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer', background: sort === s.key ? '#1a1a18' : '#fff', color: sort === s.key ? '#fff' : '#6b6b67' }}>{s.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍　キーワードで検索..."
              style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', outline: 'none', background: '#fff' }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', background: '#fff' }}>
              <option value="">すべてのステータス</option>
              {['アイデア','検討中','進行中','完成','一時停止'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '13px', background: '#fff' }}>
              <option value="">すべてのカテゴリ</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b6b67' }}>読み込み中...</div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b6b67' }}>
              <div style={{ fontSize: '40px', marginBottom: '1rem' }}>💡</div>
              <div style={{ fontWeight: '600', marginBottom: '6px' }}>まだアイデアがありません</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px', alignItems: 'start' }}>
              {sorted.map(idea => <IdeaCard key={idea.id} idea={idea} />)}
            </div>
          )}
        </div>
      </div>

      {/* 未ログイン時フッターLP */}
      {!user && (
        <div style={{ background: '#fff', borderTop: '0.5px solid rgba(0,0,0,0.08)', marginTop: '3rem', padding: '3rem 1.25rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

            {/* 仕組み */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' }}>IdeaVaultの仕組み</div>
              <div style={{ fontSize: '13px', color: '#6b6b67' }}>投稿からマッチングまで、すべてのプロセスが透明です</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '3rem' }}>
              {[
                { step: '01', title: '投稿', desc: 'アイデアを投稿。タイムスタンプで先願性を自動記録。公開範囲も自分で設定できます。', icon: '✍️' },
                { step: '02', title: 'マッチング', desc: '企業・投資家がアイデアを検索。気になったアイデアにスカウトを送ります。', icon: '🔍' },
                { step: '03', title: 'コンタクト', desc: 'スカウトを承諾すると専用チャットが開始。条件交渉をプラットフォーム内で完結。', icon: '💬' },
                { step: '04', title: '事業化', desc: '合意に至ったら事業がスタート。IdeaVaultは成功手数料のみ受け取ります。', icon: '🚀' },
              ].map(({ step, title, desc, icon }) => (
                <div key={step} style={{ background: '#f5f4f0', borderRadius: '14px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#1D9E75', background: '#E1F5EE', padding: '2px 8px', borderRadius: '20px' }}>STEP {step}</div>
                    <span style={{ fontSize: '18px' }}>{icon}</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a18', marginBottom: '6px' }}>{title}</div>
                  <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.7' }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* アイデア保護方針 */}
            <div style={{ background: '#f5f4f0', borderRadius: '16px', padding: '2rem', marginBottom: '3rem' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a18', marginBottom: '16px', textAlign: 'center' }}>🛡️ アイデアの保護方針</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { title: '知的財産権', desc: '投稿アイデアの権利は投稿者に帰属します。運営はアイデアを無断利用しません。' },
                  { title: 'タイムスタンプ', desc: '投稿日時・IDを自動記録。スクリーンショットで先願性の証跡として使えます。' },
                  { title: '公開範囲設定', desc: '全公開・概要のみ公開を選択可能。詳細は承認制にすることもできます。' },
                  { title: 'NDA同意', desc: 'スカウト送信時に秘密保持に関する同意プロセスを設けています。' },
                ].map(({ title, desc }) => (
                  <div key={title} style={{ background: '#fff', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '6px' }}>{title}</div>
                    <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.7' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 料金 */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px', textAlign: 'center' }}>料金</div>
              <div style={{ fontSize: '13px', color: '#6b6b67', textAlign: 'center', marginBottom: '1.5rem' }}>個人ユーザーは完全無料。企業・投資家向けプランあり。</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {[
                  { name: '個人・起業家', price: '無料', desc: 'アイデア投稿・閲覧・メッセージ・スカウト受信がすべて無料', color: '#1D9E75' },
                  { name: '法人フリー', price: '無料', desc: '月5件までスカウト送信無料。まず試してみたい方に', color: '#6b6b67' },
                  { name: '法人スタンダード', price: '¥20,000/月', desc: '月30件スカウト・優先表示・分析機能', color: '#1a3a5c' },
                  { name: '成功手数料', price: '¥3,000/件', desc: 'スカウトから合意に至った場合のみ発生', color: '#BA7517' },
                ].map(({ name, price, desc, color }) => (
                  <div key={name} style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem' }}>
                    <div style={{ fontSize: '12px', color: '#6b6b67', marginBottom: '4px' }}>{name}</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color, marginBottom: '8px' }}>{price}</div>
                    <div style={{ fontSize: '12px', color: '#6b6b67', lineHeight: '1.6' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a18', marginBottom: '1.5rem', textAlign: 'center' }}>よくある質問</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '720px', margin: '0 auto' }}>
                {[
                  { q: 'アイデアを投稿したら盗まれませんか？', a: '投稿したアイデアの権利は投稿者に帰属します。投稿日時はタイムスタンプで自動記録されるため、先願性の証跡として活用できます。また公開範囲を「概要のみ」に設定することもできます。' },
                  { q: '無料で使えますか？', a: '個人・起業家は完全無料です。企業・投資家も月5件までは無料でスカウトを送ることができます。' },
                  { q: 'スカウトが来たら必ず返答しないといけませんか？', a: 'いいえ。スカウトへの返答は任意です。承諾・辞退はいつでもできます。' },
                  { q: '運営者情報を教えてください。', a: 'IdeaVaultは日本のスタートアップチームが運営しています。お問い合わせはサービス内のメッセージ機能からご連絡ください。' },
                ].map(({ q, a }) => (
                  <details key={q} style={{ background: '#f5f4f0', borderRadius: '12px', padding: '14px 16px' }}>
                    <summary style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {q}<span style={{ fontSize: '18px', color: '#6b6b67' }}>+</span>
                    </summary>
                    <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.8', marginTop: '10px', paddingTop: '10px', borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>{a}</div>
                  </details>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center', padding: '2rem', background: '#1a1a18', borderRadius: '16px', marginBottom: '2rem' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>あなたのアイデアを世界に</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>今すぐ無料で登録して、最初の一歩を踏み出しましょう</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" style={{ background: '#1D9E75', color: '#fff', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>個人で登録</Link>
                <Link href="/register-company" style={{ background: '#fff', color: '#1a1a18', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>法人で登録</Link>
              </div>
            </div>

            {/* フッター */}
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                <Link href="/terms" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>利用規約</Link>
                <Link href="/privacy" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>プライバシーポリシー</Link>
                <Link href="/stories" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>成功事例</Link>
                <Link href="/reset-password" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>パスワードリセット</Link>
            </div>
            <div style={{ fontSize: '11px', color: '#a0a09c', textAlign: 'center' }}>© 2025 IdeaVault. All rights reserved.</div>
          </div>
        </div>
      )}

      {/* ログイン時フッター */}
      {user && (
        <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', padding: '2rem 1.25rem', marginTop: '2rem', textAlign: 'center', background: '#fff' }}>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
            <Link href="/terms" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>利用規約</Link>
            <Link href="/privacy" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>プライバシーポリシー</Link>
          </div>
          <div style={{ fontSize: '11px', color: '#a0a09c' }}>© 2025 IdeaVault. All rights reserved.</div>
        </div>
      )}
    </div>
  )
}