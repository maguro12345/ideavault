 import Link from 'next/link'

export default function Footer() {
  return (
    <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', padding: '2rem 1.25rem', marginTop: '2rem', textAlign: 'center', background: '#fff' }}>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
        <Link href="/terms" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>利用規約</Link>
        <Link href="/privacy" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>プライバシーポリシー</Link>
        <Link href="/legal" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>特定商取引法に基づく表記</Link>
        <Link href="/stories" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>成功事例</Link>
        <Link href="/contact" style={{ fontSize: '12px', color: '#a0a09c', textDecoration: 'none' }}>お問い合わせ</Link>
      </div>
      <div style={{ fontSize: '11px', color: '#a0a09c' }}>© 2025 IdeaVault. All rights reserved.</div>
    </div>
  )
}
