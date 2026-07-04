import { supabase } from '@/lib/supabase/client'

// Allow responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured.' }), { status: 500 })
    }

    const systemPrompt = `You are the Muse AI Assistant, a highly capable virtual agent designed to help run an aesthetic studio. 
You manage expenses, receipts, and financial reporting. You have direct access to the studio's Ledger (database of expenses). 
You also proactively manage inventory by analyzing purchase frequencies, setting reminders, and acting as an industry knowledge base by searching the web.
You MUST use your tools to accurately answer user questions about their finances, inventory, and to search the web for industry-specific information.

CRITICAL COMMUNICATION RULES:
- NEVER use Markdown formatting (no asterisks **, no bullet points -, no hashes #). 
- Speak in extremely concise, natural, conversational language. Speak like a human assistant texting a busy studio owner.
- Do not provide lists of options unless explicitly asked. Get straight to the point.`

    const toolsDefinition = [
      {
        name: "logExpense",
        description: "Log a new expense or receipt directly into the Ledger database.",
        input_schema: {
          type: "object",
          properties: {
            amount: { type: "number", description: "The total cost of the expense in USD." },
            category: { type: "string", description: "The category of the expense (e.g., Supplies, Back Bar, Rent, Utilities, Marketing, Personal, Software, Meals, Travel, Insurance, Licensing / Tax, Uncategorized)." },
            description: { type: "string", description: "A brief title or vendor name for the expense." },
            is_recurring: { type: "boolean", description: "Whether this is a recurring subscription or payment." }
          },
          required: ["amount", "category", "description"]
        }
      },
      {
        name: "searchLedger",
        description: "Search the studio ledger database for past expenses, filtered by keyword or category.",
        input_schema: {
          type: "object",
          properties: {
            keyword: { type: "string", description: "A keyword to search for in the description/vendor name (e.g., 'SkinCeuticals', 'Starbucks')." },
            category: { type: "string", description: "Filter by exact category name (e.g., 'Back Bar')." },
            limit: { type: "number", description: "Maximum number of results to return (max 50)." }
          }
        }
      },
      {
        name: "getFinancialSummary",
        description: "Calculate the total spend across all expenses, optionally filtered by a specific category.",
        input_schema: {
          type: "object",
          properties: {
            category: { type: "string", description: "If provided, only sums expenses for this specific category (e.g., 'Back Bar')." }
          }
        }
      },
      {
        name: "analyzeReorderFrequency",
        description: "Analyze how often an item is purchased to calculate reorder frequency and determine if it is time to reorder.",
        input_schema: {
          type: "object",
          properties: {
            itemName: { type: "string", description: "The name of the item or vendor to analyze (e.g., 'Chemical Peels', 'Wipes')." }
          },
          required: ["itemName"]
        }
      },
      {
        name: "manageReminders",
        description: "Add or delete items from the user's Upcoming Reminders / Shopping List.",
        input_schema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["add", "delete"], description: "Whether to add a new reminder or delete an existing one." },
            title: { type: "string", description: "The title of the reminder (e.g., 'Order esthetic wipes')." },
            days_from_now: { type: "number", description: "If adding, how many days from today the reminder is due (0 for today)." }
          },
          required: ["action", "title"]
        }
      },
      {
        name: "searchWeb",
        description: "Search the live internet to act as an industry knowledge base for trade shows, FDA guidelines, etc.",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query." }
          },
          required: ["query"]
        }
      }
    ]

    let currentMessages = [...messages]
    let toolInvocations = []

    for (let i = 0; i < 5; i++) { // Max 5 loops
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: currentMessages,
          tools: toolsDefinition
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Anthropic API Error:', errorText)
        return new Response(JSON.stringify({ error: errorText }), { status: response.status })
      }

      const responseData = await response.json()
      
      const assistantMessage = {
        role: 'assistant',
        content: responseData.content
      }
      currentMessages.push(assistantMessage)

      if (responseData.stop_reason === 'tool_use') {
        const toolCalls = responseData.content.filter((c: any) => c.type === 'tool_use')
        const toolResults = []

        for (const toolCall of toolCalls) {
          const { id, name, input } = toolCall
          let result: any = null
          
          try {
            if (name === 'logExpense') {
              const { data, error } = await supabase.from('documents').insert([{
                title: input.description,
                amount: input.amount,
                category: input.category,
                content: 'Logged via AI Assistant',
                is_recurring: input.is_recurring || false
              }]).select().single()
              
              if (error) result = { success: false, error: error.message }
              else result = { success: true, message: `Successfully logged $${input.amount} for ${input.description}.` }
              
            } else if (name === 'searchLedger') {
              let query = supabase.from('documents').select('id, title, amount, category, created_at, is_recurring').order('created_at', { ascending: false }).limit(Math.min(input.limit || 10, 50))
              if (input.category) query = query.ilike('category', input.category)
              if (input.keyword) query = query.ilike('title', `%${input.keyword}%`)
              
              const { data, error } = await query
              if (error) result = { success: false, error: error.message }
              else result = { success: true, count: data.length, results: data }

            } else if (name === 'getFinancialSummary') {
              let query = supabase.from('documents').select('amount, category')
              if (input.category) query = query.ilike('category', input.category)
              
              const { data, error } = await query
              if (error) result = { success: false, error: error.message }
              else {
                const total = data.reduce((sum: number, doc: any) => sum + (Number(doc.amount) || 0), 0)
                result = { success: true, total: total, count: data.length }
              }

            } else if (name === 'analyzeReorderFrequency') {
              const { data, error } = await supabase.from('documents').select('created_at').ilike('title', `%${input.itemName}%`).order('created_at', { ascending: false })
              
              if (error) result = { success: false, error: error.message }
              else if (!data || data.length < 2) {
                result = { success: true, message: `Not enough purchase history for '${input.itemName}' to calculate frequency.` }
              } else {
                let totalDays = 0
                for (let i = 0; i < data.length - 1; i++) {
                  const d1 = new Date(data[i].created_at).getTime()
                  const d2 = new Date(data[i+1].created_at).getTime()
                  totalDays += (d1 - d2) / (1000 * 60 * 60 * 24)
                }
                const avgDays = Math.round(totalDays / (data.length - 1))
                const daysSinceLast = Math.round((new Date().getTime() - new Date(data[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
                result = { success: true, item: input.itemName, purchaseCount: data.length, averageDaysBetweenPurchases: avgDays, daysSinceLastPurchase: daysSinceLast, isOverdue: daysSinceLast >= avgDays }
              }

            } else if (name === 'manageReminders') {
              if (input.action === 'add') {
                const due = new Date()
                due.setDate(due.getDate() + (input.days_from_now || 0))
                const { error } = await supabase.from('reminders').insert([{ title: input.title, due_date: due.toISOString().split('T')[0], type: 'inventory' }])
                if (error) result = { success: false, error: error.message }
                else result = { success: true, message: `Added reminder: ${input.title}` }
              } else {
                const { error } = await supabase.from('reminders').delete().ilike('title', `%${input.title}%`)
                if (error) result = { success: false, error: error.message }
                else result = { success: true, message: `Deleted reminder: ${input.title}` }
              }

            } else if (name === 'searchWeb') {
              const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(input.query)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
              })
              const html = await res.text()
              const snippetRegex = /<a class="result__snippet[^>]*>([^<]+)<\/a>/g
              const snippets = []
              let match
              let count = 0
              while ((match = snippetRegex.exec(html)) !== null && count < 5) {
                snippets.push(match[1].trim())
                count++
              }
              if (snippets.length === 0) result = { success: true, results: "No results found or unable to parse." }
              else result = { success: true, results: snippets }
            }
          } catch (e: any) {
            result = { success: false, error: e.message }
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: id,
            content: JSON.stringify(result)
          })

          toolInvocations.push({
            toolCallId: id,
            toolName: name,
            args: input,
            result: result
          })
        }

        currentMessages.push({
          role: 'user',
          content: toolResults
        })

      } else {
        // AI is done, return the final response
        return new Response(JSON.stringify({ 
          response: responseData.content.find((c: any) => c.type === 'text')?.text || '', 
          toolInvocations 
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Max tool loop reached' }), { status: 500 })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
