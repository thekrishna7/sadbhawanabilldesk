import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

const SYSTEM_PROMPT = `You are an expert invoice assistant for BillFlow, a smart billing and invoicing SaaS platform used primarily by Indian businesses. Your job is to analyze a user's natural language description and generate structured invoice suggestions.

RULES:
1. Extract or infer invoice items with description, quantity, rate (in INR ₹), and appropriate Indian GST tax rate.
2. Indian GST tax rates must be one of: 0%, 5%, 12%, 18%, 28%. Choose the most appropriate one based on the nature of the service/product:
   - 0%: Essential goods (food grains, fresh produce, books)
   - 5%: Essential services, basic food items, transport
   - 12%: Processed food, business services, some IT services
   - 18%: Most services (IT, consulting, professional services, digital services, software development, web design, marketing, etc.)
   - 28%: Luxury items, sin goods, premium services
3. If the user's prompt is vague (e.g., "invoice for web development"), suggest common/typical items that a professional would bill for in that domain. Break it down into reasonable line items.
4. If a customer/client name is mentioned in the prompt, extract it as billToName.
5. Rates should be realistic and in INR (₹). Use round numbers where appropriate.
6. Always return valid JSON only — no markdown, no explanation, no code blocks, no extra text.
7. The response must be exactly in this format:

{
  "items": [
    { "description": "Web Design Services", "quantity": 1, "rate": 5000, "taxPercent": 18 },
    { "description": "Logo Design", "quantity": 1, "rate": 2000, "taxPercent": 18 }
  ],
  "billToName": "Client Name (if mentioned, otherwise empty string)",
  "notes": "Brief note about the suggestions (e.g., 'Based on typical web development services')"
}

IMPORTANT: Return ONLY the JSON object. No markdown fences, no extra commentary.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, userId } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'A description prompt is required' },
        { status: 400 }
      )
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt is too long. Please keep it under 2000 characters.' },
        { status: 400 }
      )
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Call LLM
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt.trim() },
      ],
      thinking: { type: 'disabled' },
    })

    // Extract the response content
    const content = completion.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'AI did not return a response' },
        { status: 500 }
      )
    }

    // Parse the JSON response - handle potential markdown fences
    let cleanedContent = content.trim()

    // Remove markdown code fences if present
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

    let parsed
    try {
      parsed = JSON.parse(cleanedContent)
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch {
          return NextResponse.json(
            { error: 'AI returned invalid JSON. Please try again.' },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'AI returned invalid JSON. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Validate the structure
    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json(
        { error: 'AI response missing items array. Please try again.' },
        { status: 500 }
      )
    }

    // Validate and sanitize each item
    const validItems = parsed.items
      .filter((item: Record<string, unknown>) => item.description && typeof item.description === 'string')
      .map((item: Record<string, unknown>) => ({
        description: String(item.description).slice(0, 200),
        quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
        rate: Math.max(0, Math.round(Number(item.rate) || 0)),
        taxPercent: [0, 5, 12, 18, 28].includes(Number(item.taxPercent))
          ? Number(item.taxPercent)
          : 18, // Default to 18% if invalid
      }))

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'AI could not generate any invoice items. Please provide more details.' },
        { status: 500 }
      )
    }

    const result = {
      items: validItems,
      billToName: typeof parsed.billToName === 'string' ? parsed.billToName.slice(0, 100) : '',
      notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 500) : 'AI generated suggestions',
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI suggest error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions. Please try again.' },
      { status: 500 }
    )
  }
}
