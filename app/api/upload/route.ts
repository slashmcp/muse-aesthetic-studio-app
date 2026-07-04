import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json()

    // Since title/content are not required, we provide fallback defaults for the DB
    const finalTitle = title?.trim() || 'Untitled Document'
    const finalContent = content?.trim() || 'Pending AI Processing...'

    const { data, error } = await supabase
      .from('documents')
      .insert([{ title: finalTitle, content: finalContent }])
      .select()
      .single()

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

