 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdvisorNavbar from '../../../components/AdvisorNavbar'
import Footer from '../../../components/Footer'

export default function AdvisorDashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof?.is_company || prof?.company_type !== 'アドバイザー') { router.push('/'); return }
    setProfile(prof)
    const { data: c } = await supabase.from('consultation_requests')
      .select('*, profiles(id, full_name, username, avatar_url)')
      .eq('advisor_id', user.id)
      .order('created_at', { ascending: false }).limit(5)
    setConsultations(c || [])
    const { data: a } = await supabase.from('advisor_articles')
      .select('*').eq('author_id', user.id)
      .order('created_at', { ascending: false }).limit(5)
    setArticles(a || [])
    setLoading(false)
  }

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0ff' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  const name = profile?.full_name || profile?.company_name || 'アドバイザー'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0ff', fontFamily: 'system-ui, sans-serif' }}>
      <AdvisorNavbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* ヘッダー */}
        <div style={{ background: '#2d1f5e', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '1.25rem', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#9F8FEF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: '#2d1f5e', overflow: 'hidden', flexShrink: 0 }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{name}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{profile?.advisor_role || '専門家'} · {profile?.advisor_specialty || ''}</div>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '1.25rem' }}>
          {[
            { label: '相談受付数', value: consultations.length, icon: '💬' },
            { label: '記事投稿数', value: articles.length, icon: '✍️' },
            { label: '未対応の相談', value: consultations.filter(c => c.status === 'pending').length, icon: '⏳' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: '#2d1f5e' }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#6b6b67', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

          {/* 最近の相談 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>💬 最近の相談</div>
              <Link href="/advisor/consultations" style={{ fontSize: '12px', color: '#7F77DD', textDecoration: 'none', fontWeight: '600' }}>すべて見る →</Link>
            </div>
            {consultations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#a0a09c', fontSize: '13px' }}>まだ相談がありません</div>
            ) : consultations.slice(0, 4).map(c => (
              <div key={c.id} style={{ padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18', marginBottom: '2px' }}>{c.title || '相談'}</div>
                  <div style={{ fontSize: '11px', color: '#a0a09c' }}>{c.profiles?.full_name || '名無し'} · {formatDate(c.created_at)}</div>
                </div>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', background: c.status === 'pending' ? '#fdecd4' : c.status === 'answered' ? '#d8f2ea' : '#f0eeea', color: c.status === 'pending' ? '#8a4f0a' : c.status === 'answered' ? '#0d6e50' : '#6b6b67' }}>
                  {c.status === 'pending' ? '未回答' : c.status === 'answered' ? '回答済み' : 'クローズ'}
                </span>
              </div>
            ))}
          </div>

          {/* 記事一覧 */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>✍️ 投稿した記事</div>
              <Link href="/advisor/articles" style={{ fontSize: '12px', color: '#7F77DD', textDecoration: 'none', fontWeight: '600' }}>すべて見る →</Link>
            </div>
            {articles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#a0a09c', fontSize: '13px' }}>まだ記事がありません</div>
            ) : articles.slice(0, 4).map(a => (
              <div key={a.id} style={{ padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18', marginBottom: '2px' }}>{a.title}</div>
                <div style={{ fontSize: '11px', color: '#a0a09c' }}>{formatDate(a.created_at)}</div>
              </div>
            ))}
            <Link href="/advisor/articles/create" style={{ display: 'block', textAlign: 'center', marginTop: '12px', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', background: '#EEEDFE', color: '#534AB7', textDecoration: 'none' }}>
              ＋ 新しい記事を投稿
            </Link>
          </div>
        </div>

        {/* アドバイザー機能の案内 */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', marginTop: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18', marginBottom: '12px' }}>🎓 アドバイザー機能</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { icon: '💬', title: '相談を受け付ける', desc: '起業家からの相談・質問に回答できます', href: '/advisor/consultations' },
              { icon: '✍️', 'title': 'ノウハウを発信する', desc: '記事・コラムを投稿してトップページに掲載', href: '/advisor/articles' },
              { icon: '👤', title: 'プロフィールを充実させる', desc: '経歴・専門分野を登録して起業家に見つけてもらう', href: '/company/profile' },
              { icon: '🤝', title: '起業家と繋がる', desc: '共同創業者マッチングで起業家を探す', href: '/cofounder' },
            ].map(({ icon, title, desc, href }) => (
              <Link key={href} href={href} style={{ display: 'block', background: '#f5f0ff', borderRadius: '10px', padding: '12px', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#EEEDFE'}
                onMouseLeave={e => e.currentTarget.style.background = '#f5f0ff'}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d1f5e', marginBottom: '3px' }}>{title}</div>
                <div style={{ fontSize: '11px', color: '#6b6b67', lineHeight: '1.6' }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
