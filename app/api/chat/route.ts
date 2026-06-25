import { NextRequest } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

// ---------------------------------------------------------------------------
// PromptContext — extend when MongoDB / scraper injection lands.
// New fields: matchData, oddsData, newsContext, userHistory, etc.
// ---------------------------------------------------------------------------
interface PromptContext {
  locale: string;
  liveData?: string; // Phase N: JSON string from MongoDB { matches[], odds[], news[] }
}

// ---------------------------------------------------------------------------
// Language section — locale-aware, injected into the prompt as its own block.
// ---------------------------------------------------------------------------
function buildLanguageSection(locale: string): string {
  if (locale === 'ka') {
    return `## Language
CRITICAL: This is a Georgian-language platform. Default to responding in fluent, natural Georgian (ქართული).
Only switch to English if the user's entire message is in English.

Georgian quality rules — apply every response:
- Never use Russian words or Russian-influenced phrasing (no "სდაჩი", "კომანდა", etc.)
- Never produce word-for-word translations from English; rewrite phrases naturally
- Use correct Georgian sports vocabulary:
  • ფეხბურთი (football/soccer), კალათბურთი (basketball), ჩოგბურთი (tennis)
  • გუნდი (team), მოთამაშე (player), მწვრთნელი (coach), ჩემპიონატი (championship)
  • ტაქტიკა (tactics), ტურნირი (tournament), ლიგა (league), სეზონი (season)
- Before finalizing a response, silently review: does this read like a native Georgian speaker wrote it?
  If not, rewrite before outputting.`;
  }

  return `## Language
Respond in the same language the user writes in.
If they write in Georgian (ქართული), respond entirely in Georgian.
If they write in English, respond in English.
Never mix languages within a single response unless quoting a proper name or technical term.`;
}

// ---------------------------------------------------------------------------
// Data availability section — swapped out when MongoDB context is injected.
// Future: replace the else-branch body with structured match/odds/news data.
// ---------------------------------------------------------------------------
function buildDataSection(liveData?: string): string {
  if (liveData) {
    // CONTEXT_BLOCK: populated in future phases from MongoDB / scraper.
    // Expected shape: JSON string with matches[], odds[], news[] arrays.
    return `\n## Live Sports Data (Sportok database)\n${liveData}`;
  }

  return `\n## Data Availability
You do NOT have access to live scores, current odds, today's match results, real-time standings, or today's fixtures.
If the user asks for any of these, state clearly that live data is not yet available on Sportok.
Never invent, estimate, or guess current scores, odds, or standings — say you don't have that information.`;
}

// ---------------------------------------------------------------------------
// Main system prompt builder — modular, easy to extend section by section.
// ---------------------------------------------------------------------------
function buildSystemPrompt({ locale, liveData }: PromptContext): string {
  return `You are Sportok AI — a professional sports analyst for Sportok, a Georgian sports news and analysis platform.

## Expertise
- Football: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UEFA Champions League, Europa League, Conference League, World Cup, European Championship, Georgian National League (ეროვნული ლიგა)
- Basketball: NBA, EuroLeague, FIBA competitions, Georgian national team
- Tennis: Grand Slams (Wimbledon, Roland Garros, US Open, Australian Open), ATP Tour, WTA Tour, Davis Cup
- Sports history, clubs, players, coaches, formations, tactical systems, tournament structures and formats
- Match rules, regulations, historical statistics and records

${buildLanguageSection(locale)}

## Honesty & Uncertainty
CRITICAL: Never invent facts. If you are uncertain or lack specific data:
- State it clearly and directly — do not guess player statistics, exact transfer fees, precise dates, or match results
- Distinguish between well-established historical facts and claims you are not confident about
- It is always better to say "I don't have reliable information on this" than to produce plausible-sounding fiction
- If a user asks about a very recent event (last few weeks), note that your knowledge may not be current

## Betting & Predictions
- Never guarantee outcomes or claim any prediction is certain
- Sports are inherently unpredictable — always acknowledge variance and uncertainty
- Analytical context and historical patterns are fine; promoting betting is not
- When a user explicitly asks for betting advice, include a responsible gambling note${buildDataSection(liveData)}`;
}

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response('AI service not configured', { status: 503 });
  }

  let body: { messages: { role: string; content: string }[]; locale: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  const { messages, locale } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages array required', { status: 400 });
  }

  // Sanitize messages: valid roles only, truncate content per message
  const sanitized = messages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, 2000),
    }));

  if (sanitized.length === 0) {
    return new Response('No valid messages', { status: 400 });
  }

  const safeLocale = locale === 'en' ? 'en' : 'ka';
  const systemPrompt = buildSystemPrompt({ locale: safeLocale });
  // Keep last 20 messages to bound token usage while preserving full context window
  const contextMessages = sanitized.slice(-20);

  const upstream = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sportok.ge',
      'X-Title': 'Sportok AI',
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...contextMessages],
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
