import { streamText, UIMessage, convertToModelMessages, consumeStream } from 'ai'
import { buildingRegulations } from '@/lib/mock-data'

export const maxDuration = 30

const systemPrompt = `You are an AI Concierge assistant for "Torres del Parque" residential building. Your role is to help security guards and administrators answer questions about building regulations, policies, and procedures.

You have access to the building's internal regulations document below. Always answer questions based on this document when relevant. If a question is not covered by the regulations, provide helpful general guidance but mention that it's not explicitly covered in the current regulations.

Be professional, concise, and helpful. When quoting specific rules, reference the section they come from.

## Building Regulations Document:
${buildingRegulations}

## Additional Context:
- The building has 8 floors with units numbered 101-108, 201-208, etc.
- Visitor parking has 20 spots (V-01 to V-20) with a 2-hour free limit
- Security operates 24/7 with shift changes at 6:00 AM, 2:00 PM, and 10:00 PM
- For emergencies, always recommend calling 123 first and then notifying building security

Always respond in the same language the user asks the question in (Spanish or English).`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'anthropic/claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log('Chat stream aborted')
      }
    },
    consumeSseStream: consumeStream,
  })
}
