'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard')
  const [categories, setCategories] = useState([])
  const [newCat, setNewCat] = useState('')
  const [agreements, setAgreements] = useState([])
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [ideas, setIdeas] = useState([])
  const [scouts, setScouts] = useState([])
  const [companyReviews, setCompanyReviews] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) { router.push('/'); return }
    await Promise.all([
      fetchCategories(),
      fetchAgreements(),
      fetchReports(),
      fetchUsers(),
      fetchIdeas(),
      fetchScouts(),
      fetchCompanyReviews(),
      fetchStats()
    ])
    setLoading(false)
  }

  async function fetchStats() {
    const [{ count: userCount }, { count: ideaCount }, { count: scoutCount }, { count: agreementCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('ideas').select('*', { count: 'exact', head: true }).eq('is_draft', false),
      supabase.from('scouts').select('*', { count: 'exact', head: true }),
      supabase.from('scouts').select('*', { count: 'exact', head: true }).eq('status', 'agreed')
    ])
    setStats({ userCount, ideaCount, scoutCount, agreementCount })
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
  }

  async function fetchAgreements() {
    const { data } = await supabase.from('reports').select('*').eq('target_type', 'agreement').order('created_at', { ascending: false })
    setAgreements(data || [])
  }

  async function fetchReports() {
    const { data } = await supabase.from('reports').select('*, profiles!reporter_id(id, username, full_name)').neq('target_type', 'agreement').order('created_at', { ascending: false })
    setReports(data || [])
  }

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
    setUsers(data || [])
  }

  async function fetchIdeas() {
    const { data } = await supabase.from('ideas').select('*, profiles(id, username, full_name)').eq('is_draft', false).order('created_at', { ascending: false }).limit(100)
    setIdeas(data || [])
  }

  async function fetchScouts() {
    const { data } = await supabase.from('scouts').select('*, ideas(title), profiles!from_company_id(company_name, full_name)').order('created_at', { ascending: false }).limit(100)
    setScouts(data || [])
  }

  async function fetchCompanyReviews() {
    const { data } = await supabase.from('profiles').select('*').eq('is_company', true).order('created_at', { ascending: false })
    setCompanyReviews(data || [])
  }

  async function addCategory() {
    if (!newCat.trim()) return
    setSaving(true)
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0
    await supabase.from('categories').insert({ name: newCat.trim(), sort_order: maxOrder + 1 })
    setNewCat('')
    await fetchCategories()
    setSaving(false)
  }

  async function deleteCategory(id) {
    if (!confirm('このカテゴリを削除しますか？')) return
    await supabase.from('categories').delete().eq('id', id)
    await fetchCategories()
  }

  async function moveUp(index) {
    if (index === 0) return
    const a = categories[index], b = categories[index - 1]
    await supabase.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id)
    await fetchCategories()
  }

  async function moveDown(index) {
    if (index === categories.length - 1) return
    const a = categories[index], b = categories[index + 1]
    await supabase.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id)
    await fetchCategories()
  }

  async function banUser(userId, username) {
    if (!confirm(`${username}をBANしますか？`)) return
    await supabase.from('profiles').update({ is_banned: true }).eq('id', userId)
    await fetchUsers()
    alert('BANしました')
  }

  async function unbanUser(userId) {
    await supabase.from('profiles').update({ is_banned: false }).eq('id', userId)
    await fetchUsers()
    alert('BAN解除しました')
  }

  async function deleteIdea(ideaId, title) {
    if (!confirm(`「${title}」を削除しますか？`)) return
    await supabase.from('ideas').delete().eq('id', ideaId)
    await fetchIdeas()
    alert('削除しました')
  }

  async function resolveReport(reportId) {
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
    await fetchReports()
  }

  async function approveCompany(userId) {
    await supabase.from('profiles').update({ is_verified: true }).eq('id', userId)
    await fetchCompanyReviews()
    alert('承認しました')
  }

  async function rejectCompany(userId) {
    await supabase.from('profiles').update({ is_verified: false, corporate_number: null }).eq('id', userId)
    await fetchCompanyReviews()
    alert('却下しました')
  }

  function formatDate(ts) {
    const d = new Date(ts)
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`
  }

  const TABS = [
    { key: 'dashboard', label: '📊 ダッシュボード' },
    { key: 'reports', label: `🚩 通報 ${reports.filter(r => r.status === 'pending').length > 0 ? `(${reports.filter(r => r.status === 'pending').length})` : ''}` },
    { key: 'users', label: '👥 ユーザー一覧' },
    { key: 'ideas', label: '💡 投稿一覧' },
    { key: 'scouts', label: '📨 マッチング履歴' },
    { key: 'companies', label: '🏢 企業審査' },
    { key: 'agreements', label: `🤝 合意報告 ${agreements.length > 0 ? `(${agreements.length})` : ''}` },
    { key: 'categories', label: '🏷️ カテゴリ管理' },
  ]

  const cardStyle = { background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '1.25rem', marginBottom: '12px' }

  

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ color: '#6b6b67' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '1.25rem' }}>⚙️ 管理者ダッシュボード</h1>

        {/* タブ */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              border: '0.5px solid rgba(0,0,0,0.15)', cursor: 'pointer',
              background: tab === t.key ? '#1a1a18' : '#fff',
              color: tab === t.key ? '#fff' : '#6b6b67'
            }}>{t.label}</button>
          ))}
        </div>

        {/* ダッシュボード */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
              {[
                { label: 'ユーザー数', value: stats.userCount, icon: '👥' },
                { label: '投稿数', value: stats.ideaCount, icon: '💡' },
                { label: 'スカウト数', value: stats.scoutCount, icon: '📨' },
                { label: '合意成立数', value: stats.agreementCount, icon: '🤝' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ ...cardStyle, marginBottom: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#1D9E75' }}>{value || 0}</div>
                  <div style={{ fontSize: '12px', color: '#6b6b67', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>

            {agreements.length > 0 && (
              <div style={{ ...cardStyle, background: '#E1F5EE', border: '1px solid #1D9E75' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d6e50', marginBottom: '6px' }}>🎉 未処理の合意報告（{agreements.length}件）</div>
                <div style={{ fontSize: '13px', color: '#0d6e50' }}>手数料請求が必要です。「合意報告」タブで確認してください。</div>
              </div>
            )}

            {reports.filter(r => r.status === 'pending').length > 0 && (
              <div style={{ ...cardStyle, background: '#fdeae4', border: '1px solid #c04020' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#c04020', marginBottom: '6px' }}>🚩 未対応の通報（{reports.filter(r => r.status === 'pending').length}件）</div>
                <div style={{ fontSize: '13px', color: '#c04020' }}>「通報」タブで確認してください。</div>
              </div>
            )}
          </div>
        )}

        {/* 通報管理 */}
        {tab === 'reports' && (
          <div style={cardStyle}>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>通報一覧</div>
            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a0a09c' }}>通報はありません</div>
            ) : reports.map(r => (
              <div key={r.id} style={{ padding: '12px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', background: r.status === 'pending' ? '#fdeae4' : '#f0eeea', color: r.status === 'pending' ? '#c04020' : '#6b6b67', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                        {r.status === 'pending' ? '未対応' : '対応済み'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#a0a09c' }}>{formatDate(r.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18', marginBottom: '3px' }}>理由：{r.reason}</div>
                    {r.detail && <div style={{ fontSize: '12px', color: '#6b6b67' }}>{r.detail}</div>}
                    <div style={{ fontSize: '11px', color: '#a0a09c', marginTop: '3px' }}>
                      通報者：{r.profiles?.full_name || r.profiles?.username || '不明'} / 対象ID：{r.target_id}
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <button onClick={() => resolveReport(r.id)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>対応済みにする</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ユーザー一覧 */}
        {tab === 'users' && (
          <div style={cardStyle}>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>ユーザー一覧（{users.length}件）</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
                    {['名前', 'ユーザー名', 'メール', '種別', '認証', '登録日', '操作'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#a0a09c', fontWeight: '700', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)', background: u.is_banned ? '#fdeae4' : '#fff' }}>
                      <td style={{ padding: '10px', fontWeight: '600', color: '#1a1a18' }}>{u.full_name || u.company_name || '未設定'}</td>
                      <td style={{ padding: '10px', color: '#6b6b67' }}>@{u.username || '-'}</td>
                      <td style={{ padding: '10px', color: '#6b6b67', fontSize: '11px' }}>{u.email || '-'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '10px', background: u.is_company ? '#eef2f7' : '#E1F5EE', color: u.is_company ? '#1a3a5c' : '#0d6e50', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>
                          {u.is_company ? '法人' : '個人'}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        {u.is_verified ? <span style={{ fontSize: '10px', background: '#d8f2ea', color: '#0d6e50', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>✅ 認証済</span> : '-'}
                      </td>
                      <td style={{ padding: '10px', color: '#a0a09c', fontSize: '11px' }}>{formatDate(u.created_at)}</td>
                      <td style={{ padding: '10px' }}>
                        {u.is_banned ? (
                          <button onClick={() => unbanUser(u.id)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>BAN解除</button>
                        ) : (
                          <button onClick={() => banUser(u.id, u.username || u.full_name)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: '#c04020', color: '#fff', border: 'none', cursor: 'pointer' }}>BAN</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 投稿一覧 */}
        {tab === 'ideas' && (
          <div style={cardStyle}>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>投稿一覧（{ideas.length}件）</div>
            {ideas.map(idea => (
              <div key={idea.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idea.title}</div>
                  <div style={{ fontSize: '11px', color: '#a0a09c' }}>
                    {idea.profiles?.full_name || idea.profiles?.username || '不明'} / {formatDate(idea.created_at)}
                    {idea.is_hidden && <span style={{ marginLeft: '6px', color: '#BA7517', fontWeight: '600' }}>🔒 非公開</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <a href={`/ideas/${idea.id}`} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: '#f0eeea', color: '#1a1a18', textDecoration: 'none' }}>表示</a>
                  <button onClick={() => deleteIdea(idea.id, idea.title)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: '#c04020', color: '#fff', border: 'none', cursor: 'pointer' }}>削除</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* マッチング履歴 */}
        {tab === 'scouts' && (
          <div style={cardStyle}>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>マッチング履歴（{scouts.length}件）</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
                    {['企業名', 'アイデア', '種別', 'ステータス', '日付'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#a0a09c', fontWeight: '700', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scouts.map(s => (
                    <tr key={s.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                      <td style={{ padding: '10px', fontWeight: '600', color: '#1a1a18' }}>{s.profiles?.company_name || s.profiles?.full_name || '不明'}</td>
                      <td style={{ padding: '10px', color: '#6b6b67', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.ideas?.title || '-'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '10px', background: '#eef2f7', color: '#1a3a5c', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>{s.offer_type}</span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '600', background: s.status === 'agreed' ? '#d8f2ea' : s.status === 'accepted' ? '#E1F5EE' : s.status === 'rejected' ? '#f0eeea' : '#fdecd4', color: s.status === 'agreed' ? '#0d6e50' : s.status === 'accepted' ? '#0d6e50' : s.status === 'rejected' ? '#6b6b67' : '#8a4f0a' }}>
                          {s.status === 'agreed' ? '🎉 合意' : s.status === 'accepted' ? '承諾' : s.status === 'rejected' ? '辞退' : '保留'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: '#a0a09c', fontSize: '11px' }}>{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 企業審査 */}
        {tab === 'companies' && (
          <div style={cardStyle}>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>企業審査キュー（{companyReviews.length}件）</div>
            {companyReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a0a09c' }}>企業アカウントはありません</div>
            ) : companyReviews.map(c => (
              <div key={c.id} style={{ padding: '14px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a18' }}>{c.company_name || c.full_name || '未設定'}</div>
                      {c.is_verified ? (
                        <span style={{ fontSize: '10px', background: '#d8f2ea', color: '#0d6e50', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>✅ 認証済み</span>
                      ) : (
                        <span style={{ fontSize: '10px', background: '#fdecd4', color: '#8a4f0a', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>未認証</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b6b67', marginBottom: '3px' }}>
                      法人番号：{c.corporate_number || '未登録'} / 登録日：{formatDate(c.created_at)}
                    </div>
                    {c.username && <div style={{ fontSize: '11px', color: '#a0a09c' }}>@{c.username}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!c.is_verified && c.corporate_number && (
                      <button onClick={() => approveCompany(c.id)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer' }}>承認</button>
                    )}
                    {c.is_verified && (
                      <button onClick={() => rejectCompany(c.id)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: '#fff', color: '#c04020', border: '1px solid #c04020', cursor: 'pointer' }}>却下</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 合意報告 */}
        {tab === 'agreements' && (
          <div style={cardStyle}>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>合意成立報告（手数料請求が必要）</div>
            {agreements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a0a09c' }}>合意報告はありません</div>
            ) : agreements.map(a => (
              <div key={a.id} style={{ padding: '12px', background: '#E1F5EE', borderRadius: '10px', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#1a1a18', marginBottom: '4px', fontWeight: '600' }}>{a.detail}</div>
                <div style={{ fontSize: '11px', color: '#0d6e50' }}>報告日：{new Date(a.created_at).toLocaleString('ja-JP')} / ステータス：{a.status}</div>
              </div>
            ))}
          </div>
        )}

        {/* カテゴリ管理 */}
        {tab === 'categories' && (
          <div>
            <div style={{ ...cardStyle }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px' }}>新しいカテゴリを追加</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()}
                  placeholder="例：ウェルネス・メンタルヘルス"
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.15)', fontSize: '14px', outline: 'none' }} />
                <button onClick={addCategory} disabled={saving || !newCat.trim()} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', background: '#1D9E75', color: '#fff', border: 'none', cursor: 'pointer', opacity: saving || !newCat.trim() ? 0.6 : 1 }}>追加</button>
              </div>
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a18' }}>カテゴリ一覧</div>
                <div style={{ fontSize: '12px', color: '#a0a09c' }}>{categories.length}件</div>
              </div>
              {categories.map((cat, i) => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', color: '#a0a09c', width: '24px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: '14px', color: '#1a1a18' }}>{cat.name}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => moveUp(i)} disabled={i === 0} style={{ padding: '4px 8px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => moveDown(i)} disabled={i === categories.length - 1} style={{ padding: '4px 8px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', cursor: 'pointer', opacity: i === categories.length - 1 ? 0.3 : 1 }}>↓</button>
                    <button onClick={() => deleteCategory(cat.id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#c04020' }}>削除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}