 import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '56px' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', textDecoration: 'none', color: 'inherit' }}>
          IDEA<span style={{ color: '#1D9E75' }}>VAULT</span>
        </Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.25rem' }}>
        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', padding: '2.5rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>プライバシーポリシー</h1>
          <p style={{ fontSize: '13px', color: '#6b6b67', marginBottom: '2rem' }}>最終更新日：2025年4月1日</p>

          {[
            { title: '1. 収集する情報', content: '当サービスは以下の情報を収集します。\n・アカウント情報（メールアドレス、パスワード）\n・プロフィール情報（名前、ユーザー名、自己紹介、所在地、プロフィール画像）\n・投稿コンテンツ（アイデア、ピッチデック、メッセージ）\n・利用ログ（アクセス日時、IPアドレス等）' },
            { title: '2. 情報の利用目的', content: '収集した情報は以下の目的で利用します。\n・サービスの提供・運営\n・ユーザー認証・アカウント管理\n・サービスの改善・新機能の開発\n・利用規約違反の調査・対応\n・お問い合わせへの対応' },
            { title: '3. 情報の第三者提供', content: '当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。\n・ユーザーの同意がある場合\n・法令に基づく場合\n・生命・身体・財産の保護のために必要な場合' },
            { title: '4. メッセージ・通信内容について', content: 'ユーザー間のメッセージ・チャット内容はSupabaseのデータベースに保存されます。運営者はシステム管理・不正対応のためにこれらのデータにアクセスできる立場にありますが、法的要請がある場合や重大な規約違反の調査が必要な場合を除き、通常の業務においてメッセージ内容を閲覧することはありません。' },
            { title: '5. データの保管', content: '収集したデータはSupabase（米国）のサーバーに保管されます。Supabaseのプライバシーポリシーに従って適切に管理されます。' },
            { title: '6. Cookieの使用', content: '当サービスはログイン状態の維持のためにCookieを使用します。ブラウザの設定によりCookieを無効にすることができますが、その場合サービスの一部が利用できなくなる場合があります。' },
            { title: '7. アカウント削除', content: 'ユーザーはいつでも設定ページからアカウントを削除できます。アカウント削除後、投稿されたコンテンツはデータベースから削除されます。ただし、バックアップデータに一定期間残る場合があります。' },
            { title: '8. お問い合わせ', content: '本ポリシーに関するお問い合わせは、サービス内のメッセージ機能または管理者までご連絡ください。' },
            { title: '9. ポリシーの変更', content: '当サービスは、必要に応じて本ポリシーを変更することがあります。変更後のポリシーはサービス上に掲載した時点で効力を生じます。' },
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
