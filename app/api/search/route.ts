import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ data: [] })
  }

  // Format the query for PostgreSQL to_tsquery by replacing spaces with & or just basic parsing
  const formattedQuery = query.split(' ').filter(Boolean).join(' | ')

  const { data, error } = await supabase.rpc('search_documents', {
    search_query: formattedQuery,
  })

  if (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
