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
    const explicitRecurring = formData.get('isRecurring') === 'true'
    const recurringDuration = formData.get('recurringDuration') as string | null

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

    // Determine correct mimeType
    let mimeType = file.type
    if (!mimeType) {
      const ext = fileExt.toLowerCase()
      if (ext === 'pdf') mimeType = 'application/pdf'
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
      else mimeType = 'image/png'
    }

    const isPdf = mimeType === 'application/pdf'

    let extractedData: any = {
      title: file.name,
      amount: 0,
      category: 'Uncategorized',
      is_recurring: false,
      date: null,
      items: []
    }

    try {
      // Process with Claude 3.5 Sonnet
      const { object } = await generateObject({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: 'You are an expert expense parser. Read the receipt/invoice. Extract the Merchant Name (Title), the Total Amount, the Date, the Category, and an Itemized list. Default to standard business categories: Supplies, Rent, Utilities, Marketing, Personal, Software, Meals, Travel. If you detect recurring keywords like "Subscription" or "Monthly", set is_recurring to true.',
        schema: z.object({
          title: z.string().default(file.name),
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
                ? { type: 'file', data: buffer, mimeType }
                : { type: 'image', image: buffer }
            ]
          }
        ]
      })
      extractedData = object

      // Duplicate detection
      const { data: existingDocs } = await supabase
        .from('documents')
        .select('id')
        .eq('amount', extractedData.amount)
        .ilike('title', extractedData.title)
        .limit(1)

      if (existingDocs && existingDocs.length > 0) {
        extractedData.title = `[DUPLICATE] ${extractedData.title}`
      }
    } catch (parseError: any) {
      console.error('AI Parsing error:', parseError)
      return NextResponse.json({ error: `AI Processing failed: ${parseError.message || parseError}` }, { status: 500 })
    }

    // Insert into Ledger
    const finalIsRecurring = explicitRecurring ? true : extractedData.is_recurring
    
    // Format itemized list for content
    let contentBody = `Uploaded Document: ${publicUrl}`
    if (extractedData.items && extractedData.items.length > 0) {
      contentBody += '\n\n**Itemized List:**\n'
      extractedData.items.forEach((item: any) => {
        contentBody += `- ${item.description}: $${item.amount.toFixed(2)}\n`
      })
    }

    const { data, error: dbError } = await supabase
      .from('documents')
      .insert([{
        title: extractedData.title,
        content: contentBody,
        amount: extractedData.amount,
        category: extractedData.category,
        is_recurring: finalIsRecurring,
        recurring_duration: finalIsRecurring && recurringDuration ? recurringDuration : null,
        ...(extractedData.date && { created_at: new Date(extractedData.date).toISOString() })
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
