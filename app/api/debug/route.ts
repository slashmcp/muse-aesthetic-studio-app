import { supabase } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(5)
  return NextResponse.json({ data, error })
}
