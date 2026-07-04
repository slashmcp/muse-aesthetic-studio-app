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
    const categoriesStr = formData.get('categories') as string | null
    const customCategories = categoriesStr ? JSON.parse(categoriesStr) : ['Supplies', 'Rent', 'Utilities', 'Marketing', 'Personal', 'Software', 'Meals', 'Travel', 'Uncategorized']

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

    // 3. Process with Claude 3.5 Sonnet (Vision) via raw API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: `You are an expert expense parser. Read the receipt/invoice. Extract the Merchant Name (Title), the Total Amount, the Date, the Category, and an Itemized list. Restrict the Category to ONE of these exactly: ${customCategories.join(', ')}. If you detect recurring keywords like "Subscription" or "Monthly", set is_recurring to true.`,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract the details from this document:' },
              isPdf 
                ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } }
                : { type: 'image', source: { type: 'base64', media_type: mimeType, data: buffer.toString('base64') } }
            ]
          }
        ],
        tools: [{
          name: 'extract_receipt',
          description: 'Extract receipt details',
          input_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              amount: { type: 'number' },
              category: { type: 'string' },
              is_recurring: { type: 'boolean' },
              date: { type: 'string', description: 'YYYY-MM-DD format' },
              items: { 
                type: 'array', 
                items: { type: 'object', properties: { description: { type: 'string' }, amount: { type: 'number' } }, required: ['description', 'amount'] }
              }
            },
            required: ['title', 'amount', 'category', 'is_recurring']
          }
        }],
        tool_choice: { type: 'tool', name: 'extract_receipt' }
      })
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      throw new Error(`Anthropic API error: ${anthropicResponse.status} ${errText}`)
    }

    const aiData = await anthropicResponse.json()
    const toolCall = aiData.content?.find((c: any) => c.type === 'tool_use' && c.name === 'extract_receipt')
    
    const object = toolCall?.input || {
      title: 'Unknown Merchant',
      amount: 0,
      category: 'Uncategorized',
      is_recurring: false
    }

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
