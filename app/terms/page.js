 import Link from 'next/link'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '56px' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: 'inherit' }}>
          IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
        </Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.25rem' }}>
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '2.5rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>利用規約</h1>
          <p style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '2rem' }}>最終更新日：2025年4月1日</p>

          {[
            { title: '第1条（適用）', content: '本規約は、IdeaVault（以下「当サービス」）が提供するサービスの利用条件を定めるものです。ユーザーは本規約に同意した上でサービスを利用するものとします。' },
            { title: '第2条（利用登録）', content: '利用登録は、登録希望者が本規約に同意の上、所定の方法によって利用登録を申請し、当サービスがこれを承認することによって完了します。当サービスは、以下の場合には登録申請を承認しないことがあります。\n・虚偽の事項を届け出た場合\n・本規約に違反したことがある者からの申請である場合\n・その他、当サービスが利用登録を相当でないと判断した場合' },
            { title: '第3条（禁止事項）', content: 'ユーザーは、以下の行為をしてはなりません。\n・法令または公序良俗に違反する行為\n・犯罪行為に関連する行為\n・他のユーザーへの嫌がらせや誹謗中傷\n・虚偽の情報を投稿する行為\n・スパムや商業的な宣伝行為\n・他のユーザーの個人情報を無断で収集・利用する行為\n・当サービスの運営を妨害する行為\n・その他、当サービスが不適切と判断する行為' },
            { title: '第4条（投稿コンテンツ）', content: 'ユーザーが投稿したアイデア・文章・画像等のコンテンツに関する著作権はユーザー本人に帰属します。ただし、当サービスはサービスの運営・改善・プロモーション目的でコンテンツを利用できるものとします。ユーザーは、投稿するコンテンツが第三者の権利を侵害していないことを保証するものとします。' },
            { title: '第5条（サービスの変更・停止）', content: '当サービスは、ユーザーへの事前通知なしに、サービスの内容を変更・停止することができます。これによってユーザーに生じた損害について、当サービスは責任を負いません。' },
            { title: '第6条（免責事項）', content: '当サービスは、ユーザー同士のやり取り（スカウト・メッセージ・共同事業等）について一切の責任を負いません。ユーザー間のトラブルはユーザー間で解決するものとします。当サービスは、ユーザーが本サービスを利用したことによって生じた損害について、いかなる責任も負いません。' },
            { title: '第7条（個人情報の取り扱い）', content: '当サービスは、ユーザーの個人情報を適切に管理し、プライバシーポリシーに従って取り扱います。' },
            { title: '第8条（規約の変更）', content: '当サービスは、必要と判断した場合には、ユーザーへの事前通知なしに本規約を変更することができます。変更後の規約は、本サービス上に掲載した時点で効力を生じます。' },
            { title: '第9条（準拠法・管轄裁判所）', content: '本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄とします。' },
          ].map(({ title, content }) => (
            <div key={title} style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a18', marginBottom: '8px' }}>{title}</h2>
              <p style={{ fontSize: '14px', color: '#6b6b67', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{content}</p>
            </div>
          ))}

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '0.5px solid rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#1D9E75', textDecoration: 'none' }}>← トップページに戻る</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
