import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

export const maxDuration = 60 // Allow more time for file processing

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload to storage. Ensure "invoices" bucket exists and is public.' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName)

    // Read file for AI processing
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let extractedData = {
      title: file.name,
      amount: 0,
      category: 'Uncategorized',
      is_recurring: false
    }

    try {
      // Process with Claude 3.5 Sonnet
      const { object } = await generateObject({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: 'You are an expert expense parser. Read the receipt/invoice. Extract the Merchant Name (Title), the Total Amount, and the Category. Default to standard business categories: Supplies, Rent, Utilities, Marketing, Personal, Software, Meals, Travel. If you detect recurring keywords like "Subscription" or "Monthly", set is_recurring to true.',
        schema: z.object({
          title: z.string().default(file.name),
          amount: z.number().default(0),
          category: z.string().default('Uncategorized'),
          is_recurring: z.boolean().default(false),
        }),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract the details from this document:' },
              // Vercel AI SDK handles files via the 'file' or 'image' part. We use 'file' to support PDF and images natively.
              { type: 'file', data: buffer, mimeType: file.type || 'image/png' }
            ]
          }
        ]
      })
      extractedData = object
    } catch (parseError) {
      console.error('AI Parsing error:', parseError)
      // Fallback to defaults if AI fails
    }

    // Insert into Ledger
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert([{
        title: extractedData.title,
        content: `Uploaded Document: ${publicUrl}`,
        amount: extractedData.amount,
        category: extractedData.category,
        is_recurring: extractedData.is_recurring
      }])
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
