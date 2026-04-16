 import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req) {
  try {
    const { to, type, data } = await req.json()

    let subject = ''
    let html = ''

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ideavault-silk.vercel.app'

    switch (type) {
      case 'scout':
        subject = '📨 新しいスカウトが届きました！ - IdeaVault'
        html = `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
            <div style="background: #1a1a18; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center;">
              <h1 style="color: #fff; font-size: 24px; margin: 0;">IDEA<span style="color: #1D9E75">VAULT</span></h1>
            </div>
            <h2 style="color: #1a1a18; font-size: 20px;">スカウトが届きました！🎉</h2>
            <p style="color: #6b6b67; line-height: 1.8;">「<strong>${data.ideaTitle}</strong>」に対して、<strong>${data.companyName}</strong>からスカウトが届きました。</p>
            <div style="background: #f5f4f0; border-radius: 12px; padding: 1.25rem; margin: 1.5rem 0;">
              <p style="font-size: 12px; color: #a0a09c; margin: 0 0 8px 0; text-transform: uppercase; font-weight: 700;">提案内容</p>
              <p style="color: #1a1a18; margin: 0; line-height: 1.7;">${data.content?.slice(0, 200)}${data.content?.length > 200 ? '...' : ''}</p>
            </div>
            <a href="${baseUrl}/scouts" style="display: inline-block; background: #1D9E75; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">スカウトを確認する →</a>
            <p style="color: #a0a09c; font-size: 12px; margin-top: 2rem;">このメールはIdeaVaultからお送りしています。<br><a href="${baseUrl}/settings" style="color: #1D9E75;">通知設定を変更する</a></p>
          </div>
        `
        break

      case 'scout_accepted':
        subject = '✅ スカウトが承諾されました！ - IdeaVault'
        html = `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
            <div style="background: #1a1a18; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center;">
              <h1 style="color: #fff; font-size: 24px; margin: 0;">IDEA<span style="color: #1D9E75">VAULT</span></h1>
            </div>
            <h2 style="color: #1a1a18; font-size: 20px;">スカウトが承諾されました！✅</h2>
            <p style="color: #6b6b67; line-height: 1.8;">「<strong>${data.ideaTitle}</strong>」へのスカウトが承諾されました。メッセージを開始しましょう。</p>
            <a href="${baseUrl}/messages" style="display: inline-block; background: #1a3a5c; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">メッセージを開く →</a>
            <p style="color: #a0a09c; font-size: 12px; margin-top: 2rem;">このメールはIdeaVaultからお送りしています。</p>
          </div>
        `
        break

      case 'scout_agreed':
        subject = '🎉 ビジネス合意が成立しました！ - IdeaVault'
        html = `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
            <div style="background: #1a1a18; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center;">
              <h1 style="color: #fff; font-size: 24px; margin: 0;">IDEA<span style="color: #1D9E75">VAULT</span></h1>
            </div>
            <h2 style="color: #1a1a18; font-size: 20px;">ビジネス合意が成立しました！🎉</h2>
            <p style="color: #6b6b67; line-height: 1.8;">「<strong>${data.ideaTitle}</strong>」のスカウトで双方の合意が成立しました。おめでとうございます！</p>
            <div style="background: #E1F5EE; border-radius: 12px; padding: 1.25rem; margin: 1.5rem 0;">
              <p style="color: #0d6e50; margin: 0; font-weight: 700;">成功手数料（¥3,000）についてはIdeaVaultよりご連絡します。</p>
            </div>
            <a href="${baseUrl}/scouts" style="display: inline-block; background: #1D9E75; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">詳細を確認する →</a>
            <p style="color: #a0a09c; font-size: 12px; margin-top: 2rem;">このメールはIdeaVaultからお送りしています。</p>
          </div>
        `
        break

      case 'message':
        subject = '💬 新しいメッセージが届きました - IdeaVault'
        html = `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
            <div style="background: #1a1a18; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center;">
              <h1 style="color: #fff; font-size: 24px; margin: 0;">IDEA<span style="color: #1D9E75">VAULT</span></h1>
            </div>
            <h2 style="color: #1a1a18; font-size: 20px;">新しいメッセージが届きました💬</h2>
            <p style="color: #6b6b67; line-height: 1.8;"><strong>${data.senderName}</strong>さんからメッセージが届きました。</p>
            <a href="${baseUrl}/messages" style="display: inline-block; background: #1D9E75; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">メッセージを開く →</a>
            <p style="color: #a0a09c; font-size: 12px; margin-top: 2rem;">このメールはIdeaVaultからお送りしています。<br><a href="${baseUrl}/settings" style="color: #1D9E75;">通知設定を変更する</a></p>
          </div>
        `
        break

      case 'watch':
        subject = '👁 アイデアがウォッチされました - IdeaVault'
        html = `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
            <div style="background: #1a1a18; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center;">
              <h1 style="color: #fff; font-size: 24px; margin: 0;">IDEA<span style="color: #1D9E75">VAULT</span></h1>
            </div>
            <h2 style="color: #1a1a18; font-size: 20px;">アイデアがウォッチされました👁</h2>
            <p style="color: #6b6b67; line-height: 1.8;">「<strong>${data.ideaTitle}</strong>」が<strong>${data.watcherName}</strong>さんにウォッチされました。</p>
            <a href="${baseUrl}/ideas/${data.ideaId}" style="display: inline-block; background: #1D9E75; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">アイデアを確認する →</a>
            <p style="color: #a0a09c; font-size: 12px; margin-top: 2rem;">このメールはIdeaVaultからお送りしています。</p>
          </div>
        `
        break

      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }

    const { data: result, error } = await resend.emails.send({
      from: 'IdeaVault <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: result?.id })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
