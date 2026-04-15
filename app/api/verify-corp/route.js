import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const number = searchParams.get('number')

  if (!number || number.length !== 13) {
    return NextResponse.json({ found: false, message: '法人番号は13桁で入力してください' })
  }

  try {
    const res = await fetch(
      `https://api.houjin-bangou.nta.go.jp/4/num?id=&number=${number}&type=12&history=0`,
      { headers: { 'Accept': 'application/json' } }
    )
    const text = await res.text()

    // レスポンスにcorporationが含まれているか確認
    if (text.includes('"corporationNumber"') || text.includes('<corporationNumber>') || text.includes(number)) {
      // 法人番号が見つかった場合
      const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/) || text.match(/<name>([^<]+)<\/name>/)
      const corpName = nameMatch ? nameMatch[1] : null
      return NextResponse.json({ found: true, corpName, message: `法人番号が確認できました${corpName ? `（${corpName}）` : ''}` })
    } else {
      return NextResponse.json({ found: false, message: '該当する法人番号が見つかりませんでした' })
    }
  } catch (err) {
    return NextResponse.json({ found: false, message: 'APIの確認に失敗しました: ' + err.message })
  }
}