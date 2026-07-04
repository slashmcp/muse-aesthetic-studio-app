import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const { title, content, isRecurring, recurringDuration } = await request.json()

    let finalTitle = title?.trim() || 'Untitled Document'
    const finalContent = content?.trim() || 'Pending AI Processing...'
    let amount = 0
    let category = 'Uncategorized'

    // If there is content, try to extract amount and category
    if (finalContent && finalContent !== 'Pending AI Processing...') {
      try {
        const { object } = await generateObject({
          model: anthropic('claude-4-5-haiku-20251001'),
          system: 'You are an expense parser. Extract the total amount and the category from the text. Use a standard business expense category (e.g., Supplies, Rent, Software, Meals, Travel). If you can extract a short title, provide it.',
          schema: z.object({
            amount: z.number().default(0),
            category: z.string().default('Uncategorized'),
            title: z.string().optional()
          }),
          prompt: `Parse this text: ${finalContent}`,
        })
        amount = object.amount
        category = object.category
        if (!title?.trim() && object.title) {
          finalTitle = object.title
        }
      } catch (parseError) {
        console.error('AI parsing error:', parseError)
      }
    }

    const { data, error } = await supabase
      .from('documents')
      .insert([{ 
        title: finalTitle, 
        content: finalContent,
        amount,
        category,
        is_recurring: isRecurring || false,
        recurring_duration: recurringDuration || null
      }])
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

