import { anthropic } from '@ai-sdk/anthropic'
import { streamText, tool } from 'ai'
import { z } from 'zod'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await streamText({
      model: anthropic('claude-4-5-haiku-20251001'),
      system: 'You are the Muse AI Assistant, a highly capable virtual agent designed to help run an aesthetic studio. You are professional, concise, and helpful. You help manage appointments, expenses, and non-resellable inventory. You also pay special attention to esthetician events and trade shows in Chicago and Des Moines.',
      messages,
      tools: {
        logExpense: tool({
          description: 'Log a new expense or receipt into the system.',
          parameters: z.object({
            amount: z.number().describe('The cost of the expense.'),
            category: z.string().describe('The category of the expense (e.g., supplies, rent).'),
            description: z.string().describe('A brief description of what was purchased.'),
          }),
          execute: async ({ amount, category, description }) => {
            // Mock backend action
            console.log(`[Tool Executed] logExpense: ${amount} for ${description} in ${category}`)
            return { success: true, message: `Successfully logged $${amount} for ${description} under ${category}.` }
          },
        }),
        searchDatabase: tool({
          description: 'Search the studio database for past records, inventory, or client info.',
          parameters: z.object({
            query: z.string().describe('The search query or keyword.'),
          }),
          execute: async ({ query }) => {
            console.log(`[Tool Executed] searchDatabase: ${query}`)
            return { success: true, results: `Found 3 matching records for '${query}' (Mock data).` }
          },
        }),
        getEventTickets: tool({
          description: 'Get ticket prices or offer to purchase tickets for an esthetician event or trade show.',
          parameters: z.object({
            eventName: z.string().describe('The name of the event or trade show.'),
            location: z.string().describe('The location of the event (e.g., Chicago, Des Moines).'),
          }),
          execute: async ({ eventName, location }) => {
            console.log(`[Tool Executed] getEventTickets: ${eventName} in ${location}`)
            return { success: true, message: `Tickets for ${eventName} in ${location} start at $150. Would you like me to reserve a pass for you?` }
          },
        }),
      },
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
