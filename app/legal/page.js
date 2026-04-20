 export default function LegalPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.25rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2rem', color: '#1a1a18' }}>特定商取引法に基づく表記</h1>

        <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {[
            { label: '販売業者', value: 'IdeaVault運営事務局' },
            { label: '運営責任者', value: '（お問い合わせ後にご案内いたします）' },
            { label: '所在地', value: '（お問い合わせ後にご案内いたします）' },
            { label: '電話番号', value: '（お問い合わせ後にご案内いたします）' },
            { label: 'メールアドレス', value: 'support@ideavault-silk.vercel.app' },
            { label: 'ウェブサイト', value: 'https://ideavault-silk.vercel.app' },
            { label: 'サービス名', value: 'IdeaVault（起業家向けアイデアマッチングプラットフォーム）' },
            { label: '販売価格', value: 'スタンダードプラン：月額20,000円（税込）\nエンタープライズプラン：月額100,000円（税込）\n成功手数料：3,000円/件（双方合意時）' },
            { label: '支払方法', value: 'クレジットカード（Visa・Mastercard・American Express）' },
            { label: '支払時期', value: '月額プランは申込時に課金が発生し、以降1ヶ月ごとに自動更新されます。' },
            { label: 'サービス提供時期', value: '決済完了後、即時ご利用いただけます。' },
            { label: 'キャンセル・返金', value: '月額サブスクリプションはいつでもキャンセル可能です。キャンセル後は当該月末まで利用できます。日割り返金は行っておりません。' },
            { label: '動作環境', value: 'インターネット接続環境が必要です。推奨ブラウザ：Google Chrome・Safari・Firefox最新版' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 16px', background: '#f5f4f0', fontSize: '13px', fontWeight: '600', color: '#1a1a18' }}>{label}</div>
              <div style={{ padding: '14px 16px', fontSize: '13px', color: '#6b6b67', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', fontSize: '12px', color: '#a0a09c', textAlign: 'center' }}>
          © 2025 IdeaVault. All rights reserved.
        </div>
      </div>
    </div>
  )
}
