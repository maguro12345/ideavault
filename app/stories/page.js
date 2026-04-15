 'use client'
import Link from 'next/link'

export default function StoriesPage() {
  const STORIES = [
    {
      title: 'フードテックスタートアップが大手食品メーカーと業務提携',
      summary: 'IdeaVaultに投稿した「食品ロス削減AIアプリ」が大手食品メーカーの目に留まり、スカウトから3ヶ月で業務提携契約を締結。現在はPOC（概念実証）フェーズを進行中。',
      company_name: '株式会社〇〇フーズ',
      entrepreneur_name: '田中さん（起業家・25歳）',
      deal_type: '業務提携',
      amount: '非公開',
      category: 'フードテック'
    },
    {
      title: 'ヘルスケアアプリがベンチャーキャピタルから資金調達',
      summary: '「高齢者向け服薬管理アプリ」のアイデアをIdeaVaultに投稿後、医療系VCからスカウトを受信。NDA締結後に詳細を共有し、シードラウンドでの投資合意に至った。',
      company_name: '医療特化型VC',
      entrepreneur_name: '鈴木さん（エンジニア・32歳）',
      deal_type: '投資',
      amount: '2,000万円',
      category: 'ヘルスケア'
    },
    {
      title: 'EdTechプラットフォームが教育機関と共同開発契約',
      summary: '学習支援AIのアイデアが私立大学の事業開発部門の目に留まり、共同開発のオファーへ。現在は実証実験を経てサービス化を目指している。',
      company_name: '某私立大学',
      entrepreneur_name: '山田さん（学生・21歳）',
      deal_type: '共同開発',
      amount: '非公開',
      category: 'エドテック'
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: 'inherit' }}>
          IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
        </Link>
        <Link href="/login" style={{ background: '#1D9E75', color: '#fff', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>ログイン</Link>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Success Stories</div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a18', marginBottom: '12px', letterSpacing: '-0.5px' }}>IdeaVaultから生まれた成功事例</h1>
          <p style={{ fontSize: '14px', color: '#6b6b67', lineHeight: '1.8' }}>
            アイデアを投稿したことで、人生が変わった起業家たちの物語
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '3rem' }}>
          {STORIES.map((story, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '2rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', background: '#E1F5EE', color: '#0d6e50', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>{story.category}</span>
                  <span style={{ fontSize: '11px', background: '#eef2f7', color: '#1a3a5c', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>{story.deal_type}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a18', marginBottom: '10px', lineHeight: '1.4' }}>{story.title}</div>
                <div style={{ fontSize: '13px', color: '#6b6b67', lineHeight: '1.8', marginBottom: '16px' }}>{story.summary}</div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#a0a09c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>起業家</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{story.entrepreneur_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#a0a09c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>パートナー</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{story.company_name}</div>
                  </div>
                  {story.amount !== '非公開' && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#a0a09c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>金額</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1D9E75' }}>{story.amount}</div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 8px' }}>🚀</div>
                <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '700' }}>成功</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: '#1a1a18', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>あなたの事例を次に</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
            IdeaVaultに投稿して、企業・投資家と出会いましょう
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ background: '#1D9E75', color: '#fff', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>無料でアイデアを投稿</Link>
            <Link href="/" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '11px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>アイデアを見る</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#6b6b67', textDecoration: 'none' }}>← トップページに戻る</Link>
        </div>
      </div>
    </div>
  )
}
