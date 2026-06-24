import { NextRequest } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free';

function buildSystemPrompt(context?: string): string {
  // CONTEXT_BLOCK: future phases inject MongoDB match/odds/news data here.
  // Shape will be: structured JSON string with matches[], news[], odds[].
  const contextBlock = context
    ? `\n\n## Live Sports Data (from Sportok database)\n${context}`
    : `\n\n## Data Availability Notice\nYou do NOT have access to live scores, current odds, today's match results, or real-time sports data. When a user asks for any of these, clearly explain: "Live data integration is not yet available on Sportok. I can help with general sports knowledge, historical statistics, team/player information, and analytical perspectives."`;

  return `You are Sportok AI Assistant — a professional sports analyst and advisor for Sportok, a Georgian sports news and analysis platform.

## Expertise
- Football (soccer): Premier League, La Liga, Serie A, Bundesliga, UEFA Champions League, World Cup, Georgian football
- Basketball: NBA, EuroLeague, FIBA competitions
- Tennis: Grand Slams, ATP/WTA Tours, Davis Cup
- Sports history, clubs, teams, players, coaches, managers
- Match rules, formats, tournament structures, tactical systems
- Historical matches, results, statistics, records
- Sports terminology in both English and Georgian

## Language Rules
CRITICAL: Always reply in the exact same language the user writes in. If they write in Georgian (ქართული), respond entirely in Georgian. If they write in English, respond in English. Never mix languages in a single response unless quoting a name or term.

## Betting & Predictions
- Never guarantee a winning bet or claim any prediction is certain
- Always acknowledge uncertainty and variance in sports outcomes
- When discussing betting: explain the concept, provide analytical context, state clearly it is speculative
- You are a sports ANALYST, not a betting promoter
- Responsible gambling reminder is appropriate when users ask for betting advice

## Response Style
- Structured answers with bullet points or numbered lists for complex topics
- Concise but thorough — quality over length
- Professional and informative tone
- When you don't know something specific, say so honestly${contextBlock}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response('AI service not configured', { status: 503 });
  }

  let body: { messages: { role: string; content: string }[]; locale: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  const { messages, locale, context } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages array required', { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(context);

  const upstream = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sportok.ge',
      'X-Title': 'Sportok AI Assistant',
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    console.error('OpenRouter error:', upstream.status, err);
    return new Response('AI service error', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
