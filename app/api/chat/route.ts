import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await streamText({
      model: anthropic('claude-4-5-haiku-20251001'),
      system: 'You are the Muse AI Assistant, a highly capable virtual agent designed to help run an aesthetic studio. You are professional, concise, and helpful. You help manage appointments, expenses, and non-resellable inventory.',
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
