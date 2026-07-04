import { anthropic } from '@ai-sdk/anthropic'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: 'You are the Muse AI Assistant, a highly capable virtual agent designed to help run an aesthetic studio. You are professional, concise, and helpful. You manage expenses, receipts, and financial reporting. You have direct access to the studio\'s Ledger (database of expenses). You MUST use your tools to accurately answer user questions about their finances.',
      messages,
      tools: {
        logExpense: tool({
          description: 'Log a new expense or receipt directly into the Ledger database.',
          parameters: z.object({
            amount: z.number().describe('The total cost of the expense in USD.'),
            category: z.string().describe('The category of the expense (e.g., Supplies, Back Bar, Rent, Utilities, Marketing, Personal, Software, Meals, Travel, Insurance, Licensing / Tax, Uncategorized).'),
            description: z.string().describe('A brief title or vendor name for the expense.'),
            is_recurring: z.boolean().default(false).describe('Whether this is a recurring subscription or payment.')
          }),
          execute: async ({ amount, category, description, is_recurring }) => {
            const { data, error } = await supabase
              .from('documents')
              .insert([{
                title: description,
                amount: amount,
                category: category,
                content: `Logged via AI Assistant`,
                is_recurring: is_recurring
              }])
              .select()
              .single()

            if (error) {
              console.error('Insert error:', error)
              return { success: false, error: error.message }
            }
            return { success: true, message: `Successfully logged $${amount} for ${description} under ${category}.`, data }
          },
        }),
        searchLedger: tool({
          description: 'Search the studio ledger database for past expenses, filtered by keyword or category.',
          parameters: z.object({
            keyword: z.string().optional().describe('A keyword to search for in the description/vendor name (e.g., "SkinCeuticals", "Starbucks").'),
            category: z.string().optional().describe('Filter by exact category name (e.g., "Back Bar").'),
            limit: z.number().default(10).describe('Maximum number of results to return (max 50).')
          }),
          execute: async ({ keyword, category, limit }) => {
            let query = supabase.from('documents').select('id, title, amount, category, created_at, is_recurring').order('created_at', { ascending: false }).limit(Math.min(limit, 50))
            
            if (category) query = query.ilike('category', category)
            if (keyword) query = query.ilike('title', `%${keyword}%`)
            
            const { data, error } = await query
            if (error) return { success: false, error: error.message }
            return { success: true, count: data.length, results: data }
          },
        }),
        getFinancialSummary: tool({
          description: 'Calculate the total spend across all expenses, optionally filtered by a specific category.',
          parameters: z.object({
            category: z.string().optional().describe('If provided, only sums expenses for this specific category (e.g., "Back Bar").')
          }),
          execute: async ({ category }) => {
            let query = supabase.from('documents').select('amount, category')
            if (category) query = query.ilike('category', category)
            
            const { data, error } = await query
            if (error) return { success: false, error: error.message }
            
            const total = data.reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0)
            return { success: true, total: total, count: data.length, category: category || 'All Categories' }
          }
        })
      },
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
