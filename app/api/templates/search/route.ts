import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { q, docType, jurisdiction, limit = 20 } = await req.json().catch(() => ({}))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // service role: server-only route
  )

  let query = supabase.from('templates').select('*').limit(limit)

  if (docType) query = query.eq('doc_type', docType)
  if (jurisdiction) query = query.eq('jurisdiction', jurisdiction)
  if (q && q.trim()) {
    // cheap multi-field search
    query = query.or(`title.ilike.%${q}%,tags.cs.{${q}},body_md.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ results: data ?? [] })
}
