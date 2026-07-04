// @ts-nocheck
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
      system: `You are the Muse AI Assistant, a highly capable virtual agent designed to help run an aesthetic studio. You are professional, concise, and helpful. 
You manage expenses, receipts, and financial reporting. You have direct access to the studio's Ledger (database of expenses). 
You also proactively manage inventory by analyzing purchase frequencies, setting reminders, and acting as an industry knowledge base by searching the web.
You MUST use your tools to accurately answer user questions about their finances, inventory, and to search the web for industry-specific information.`,
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
        }),
        analyzeReorderFrequency: tool({
          description: 'Analyze how often an item is purchased to calculate reorder frequency and determine if it is time to reorder.',
          parameters: z.object({
            itemName: z.string().describe('The name of the item or vendor to analyze (e.g., "Chemical Peels", "Wipes").')
          }),
          execute: async ({ itemName }) => {
            const { data, error } = await supabase
              .from('documents')
              .select('created_at')
              .ilike('title', `%${itemName}%`)
              .order('created_at', { ascending: false })
            
            if (error) return { success: false, error: error.message }
            if (!data || data.length < 2) {
              return { success: true, message: `Not enough purchase history for '${itemName}' to calculate frequency.` }
            }
            
            // Calculate average days between purchases
            let totalDays = 0
            for (let i = 0; i < data.length - 1; i++) {
              const d1 = new Date(data[i].created_at).getTime()
              const d2 = new Date(data[i+1].created_at).getTime()
              totalDays += (d1 - d2) / (1000 * 60 * 60 * 24)
            }
            const avgDays = Math.round(totalDays / (data.length - 1))
            const daysSinceLast = Math.round((new Date().getTime() - new Date(data[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
            
            return { 
              success: true, 
              item: itemName, 
              purchaseCount: data.length, 
              averageDaysBetweenPurchases: avgDays,
              daysSinceLastPurchase: daysSinceLast,
              isOverdue: daysSinceLast >= avgDays
            }
          }
        }),
        manageReminders: tool({
          description: 'Add or delete items from the user\'s Upcoming Reminders / Shopping List.',
          parameters: z.object({
            action: z.enum(['add', 'delete']).describe('Whether to add a new reminder or delete an existing one.'),
            title: z.string().describe('The title of the reminder (e.g., "Order esthetic wipes").'),
            days_from_now: z.number().optional().describe('If adding, how many days from today the reminder is due (0 for today).')
          }),
          execute: async ({ action, title, days_from_now }) => {
            if (action === 'add') {
              const due = new Date()
              due.setDate(due.getDate() + (days_from_now || 0))
              
              const { error } = await supabase.from('reminders').insert([{
                title,
                due_date: due.toISOString().split('T')[0],
                type: 'inventory'
              }])
              if (error) return { success: false, error: error.message }
              return { success: true, message: `Added reminder: ${title}` }
            } else {
              // Match by title
              const { error } = await supabase.from('reminders').delete().ilike('title', `%${title}%`)
              if (error) return { success: false, error: error.message }
              return { success: true, message: `Deleted reminder: ${title}` }
            }
          }
        }),
        searchWeb: tool({
          description: 'Search the live internet to act as an industry knowledge base for trade shows, FDA guidelines, etc.',
          parameters: z.object({
            query: z.string().describe('The search query.')
          }),
          execute: async ({ query }) => {
            try {
              const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
              })
              const html = await res.text()
              
              // Simple regex to extract snippets
              const snippetRegex = /<a class="result__snippet[^>]*>([^<]+)<\/a>/g
              const snippets = []
              let match
              let count = 0
              while ((match = snippetRegex.exec(html)) !== null && count < 5) {
                snippets.push(match[1].trim())
                count++
              }
              
              if (snippets.length === 0) {
                 return { success: true, results: "No results found or unable to parse." }
              }
              return { success: true, results: snippets }
            } catch (error: any) {
              return { success: false, error: error.message }
            }
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
