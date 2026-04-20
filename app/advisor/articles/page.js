 'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/Navbar'
import AdvisorNavbar from '../../../components/AdvisorNavbar'
import Footer from '../../../components/Footer'

export default function ArticlesPage() {
  const [user, setUser] = useState(null)
  const [isAdvisor, setIsAdvisor] = useState(false)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('company_type').eq('id', user.id).single()
      setIsAdvisor(prof?.company_type === 'アドバイザー')
    }
    const { data } = await supabase.from('advisor_articles')
      .select('*, profiles!author_id(id, full_name, company_name, avatar_url, advisor_role, is_verified)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
    setArticles(data || [])
    setLoading(false)
  }

  const CATEGORIES = ['起業家精神', '資金調達', '法務・契約', 'マーケティング', 'プロダクト開発', 'チームビルディング', '財務・会計', 'その他']

  const filtered = articles.filter(a => !filter || a.category === filter)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      {isAdvisor ? <AdvisorNavbar /> : <Navbar />}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>📚 アドバイザーコンテンツ</h1>
            <div style={{ fontSize: '13px', color: '#6b6b67', marginTop: '4px' }}>専門家によるノウハウ・アドバイス</div>
          </div>
          {isAdvisor && (
            <Link href="/advisor/articles/create" style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: '#2d1f5e', color: '#fff', textDecoration: 'none' }}>＋ 記事を投稿</Link>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button onClick={() => setFilter('')} style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer', background: !filter ? '#2d1f5e' : '#fff', color: !filter ? '#fff' : '#6b6b67' }}>すべて</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c === filter ? '' : c)} style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer', background: filter === c ? '#2d1f5e' : '#fff', color: filter === c ? '#fff' : '#6b6b67' }}>{c}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📚</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' }}>まだ記事がありません</div>
            {isAdvisor && <Link href="/advisor/articles/create" style={{ fontSize: '13px', color: '#7F77DD', fontWeight: '600', textDecoration: 'none' }}>最初の記事を投稿する →</Link>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(a => {
              const author = a.profiles
              const authorName = author?.full_name || author?.company_name || '名無し'
              return (
                <div key={a.id} onClick={() => router.push(`/advisor/articles/${a.id}`)}
                  style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.5rem', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a18', lineHeight: '1.4' }}>{a.title}</div>
                    {a.category && <span style={{ fontSize: '11px', background: '#EEEDFE', color: '#534AB7', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', flexShrink: 0 }}>{a.category}</span>}
                  </div>
                  {a.content && <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.7', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '12px' }}>{a.content}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#534AB7', overflow: 'hidden', flexShrink: 0 }}>
                      {author?.avatar_url ? <img src={author.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorName[0]}
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a18' }}>{authorName}</span>
                      {author?.advisor_role && <span style={{ fontSize: '11px', color: '#a0a09c', marginLeft: '6px' }}>{author.advisor_role}</span>}
                    </div>
                    {author?.is_verified && <span style={{ fontSize: '10px' }}>✅</span>}
                    <span style={{ fontSize: '11px', color: '#a0a09c', marginLeft: 'auto' }}>{new Date(a.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
