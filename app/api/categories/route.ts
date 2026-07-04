import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Categories error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    if (!name) throw new Error('Category name is required')

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Add category error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Category delete error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
