import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { companyId } = await req.json()

    const { data: scouts } = await supabase.from('scouts')
      .select('status, created_at, updated_at')
      .eq('from_company_id', companyId)

    if (!scouts || scouts.length === 0) {
      return NextResponse.json({ rate: null, avgHours: null })
    }

    const responded = scouts.filter(s => s.status !== 'pending')
    const rate = Math.round((responded.length / scouts.length) * 100)

    const hours = responded
      .filter(s => s.updated_at)
      .map(s => (new Date(s.updated_at) - new Date(s.created_at)) / 3600000)
    const avgHours = hours.length > 0 ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length) : null

    await supabase.from('profiles').update({
      response_rate: rate,
      avg_response_hours: avgHours
    }).eq('id', companyId)

    return NextResponse.json({ rate, avgHours })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}