import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

export const maxDuration = 60 // Allow more time for image processing

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    
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

    // 2. Read image as Buffer to send to Claude
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine correct mimeType
    let mimeType = file.type
    if (!mimeType) {
      const ext = fileExt.toLowerCase()
      if (ext === 'pdf') mimeType = 'application/pdf'
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
      else mimeType = 'image/png'
    }

    const isPdf = mimeType === 'application/pdf'

    // 3. Process with Claude 3.5 Sonnet (Vision)
    const { object } = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: 'You are an expert expense parser. Read the receipt/invoice. Extract the Merchant Name (Title), the Total Amount, the Date, the Category, and an Itemized list. Default to standard business categories: Supplies, Rent, Utilities, Marketing, Personal, Software, Meals, Travel. If you detect recurring keywords like "Subscription" or "Monthly", set is_recurring to true.',
      schema: z.object({
        title: z.string().default('Unknown Merchant'),
        amount: z.number().default(0),
        category: z.string().default('Uncategorized'),
        is_recurring: z.boolean().default(false),
        date: z.string().describe('The date on the invoice/receipt in YYYY-MM-DD format.').optional(),
        items: z.array(z.object({
          description: z.string(),
          amount: z.number()
        })).optional()
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the details from this document:' },
            isPdf 
              ? { type: 'file', data: buffer.toString('base64'), mimeType } 
              : { type: 'image', image: buffer.toString('base64') }
          ]
        }
      ]
    })

    // Duplicate detection
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('amount', object.amount)
      .ilike('title', object.title)
      .limit(1)

    const is_duplicate = existingDocs && existingDocs.length > 0

    // 4. Return the data to the client for review before inserting to DB
    return NextResponse.json({ 
      extracted: object,
      publicUrl,
      is_duplicate
    })
  } catch (error: any) {
    console.error('OCR Processing error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
