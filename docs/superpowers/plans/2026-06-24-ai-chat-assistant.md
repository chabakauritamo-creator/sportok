# AI Chat Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent floating AI chat widget powered by OpenRouter that answers sports questions in Georgian and English, with an architecture that accepts MongoDB context injection in future phases.

**Architecture:** Client-side `ChatWidget` component lives in `app/[locale]/layout.tsx` (rendered once, persists across page navigations). A Next.js API route at `/api/chat` proxies streaming requests to OpenRouter, building a system prompt that has a `CONTEXT_BLOCK` placeholder — future phases populate this from MongoDB without touching the component. i18n strings follow the existing prop-drill pattern: server layout passes translated `chatStrings` object to the client widget.

**Tech Stack:** OpenRouter API (`nvidia/nemotron-3-nano-30b-a3b:free`), Server-Sent Events (SSE) streaming, `ReadableStream` browser API, Next.js App Router API route, Tailwind CSS 4 custom properties, existing `Dictionary` type (auto-extends via JSON).

## Global Constraints

- Next.js 16.2.6 App Router — no Pages Router patterns
- `'use client'` components receive only serializable props from server parents
- All UI strings must be added to **both** `messages/en.json` and `messages/ka.json`
- Use CSS custom properties (`--color-bg`, `--color-surface`, `--color-accent`, etc.) from `globals.css` — never hardcode colors
- `OPENROUTER_API_KEY` must stay in `.env.local` — never commit it
- No test suite exists — manual verification steps replace automated tests
- Dark theme only; no light-mode variants needed

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `.env.local` | Modify | Add `OPENROUTER_API_KEY` |
| `messages/en.json` | Modify | Add `chat` i18n section |
| `messages/ka.json` | Modify | Add `chat` i18n section (Georgian) |
| `app/api/chat/route.ts` | Create | OpenRouter proxy, SSE streaming, system prompt |
| `components/ChatWidget.tsx` | Create | Floating button + chat window, streaming UI |
| `app/[locale]/layout.tsx` | Modify | Mount `ChatWidget` with locale + strings |

---

### Task 1: Environment Setup + i18n Strings

**Files:**
- Modify: `.env.local` (create if absent)
- Modify: `messages/en.json`
- Modify: `messages/ka.json`

**Interfaces:**
- Produces: `t.chat` dictionary section used by Tasks 3 and 4

---

- [ ] **Step 1: Add API key to `.env.local`**

Create or open `.env.local` in project root. Add:

```env
OPENROUTER_API_KEY=your_key_here
```

Replace `your_key_here` with your actual OpenRouter key. This file must NOT be committed — verify `.gitignore` includes `.env.local`.

- [ ] **Step 2: Add English chat strings to `messages/en.json`**

Open `messages/en.json`. Insert the `chat` section before the closing `}` (after `"common"` block):

```json
  "chat": {
    "title": "Sportok AI Assistant",
    "subtitle": "Sports analyst & advisor",
    "placeholder": "Ask about football, basketball, tennis...",
    "send": "Send",
    "thinking": "Analyzing...",
    "welcome": "Hi! I'm your Sportok AI Assistant. Ask me anything about sports — teams, players, history, tactics, or tournament formats.",
    "error": "Unable to reach AI service. Please try again.",
    "noLiveData": "Live scores and real-time data are not yet available. I can help with general sports knowledge, historical data, and analysis.",
    "close": "Close chat",
    "open": "Open AI chat assistant"
  }
```

- [ ] **Step 3: Add Georgian chat strings to `messages/ka.json`**

Open `messages/ka.json`. Insert the `chat` section before the closing `}`:

```json
  "chat": {
    "title": "Sportok AI ასისტენტი",
    "subtitle": "სპორტის ანალიტიკოსი და კონსულტანტი",
    "placeholder": "იკითხე ფეხბურთზე, კალათბურთზე, ჩოგბურთზე...",
    "send": "გაგზავნა",
    "thinking": "ანალიზი...",
    "welcome": "გამარჯობა! მე ვარ Sportok AI ასისტენტი. მომეკითხე ნებისმიერი სპორტული თემა — გუნდები, მოთამაშეები, ისტორია, ტაქტიკა ან ტურნირის ფორმატები.",
    "error": "AI სერვისთან კავშირი ვერ მოხერხდა. გთხოვთ, სცადეთ ხელახლა.",
    "noLiveData": "ცოცხალი ანგარიში და რეალურ-დროული მონაცემები ჯერ არ არის ხელმისაწვდომი. შემიძლია დავეხმარო ზოგად სპორტულ ცოდნაში, ისტორიულ მონაცემებსა და ანალიზში.",
    "close": "ჩათის დახურვა",
    "open": "AI ჩათ-ასისტენტის გახსნა"
  }
```

- [ ] **Step 4: Verify TypeScript picks up new keys**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors. The `Dictionary` type in `i18n/config.ts` is inferred from JSON imports — new keys appear automatically.

- [ ] **Step 5: Commit**

```bash
git add .env.local messages/en.json messages/ka.json
git commit -m "feat: add chat i18n strings and OpenRouter env var"
```

---

### Task 2: Chat API Route

**Files:**
- Create: `app/api/chat/route.ts`

**Interfaces:**
- Consumes: `OPENROUTER_API_KEY` env var
- Produces:
  - `POST /api/chat` — accepts `{ messages: ChatMessage[], locale: string, context?: string }`, returns SSE stream
  - `ChatMessage` shape: `{ role: 'user' | 'assistant' | 'system', content: string }`

---

- [ ] **Step 1: Create the API route**

Create `app/api/chat/route.ts`:

```typescript
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
```

- [ ] **Step 2: Start dev server and test the route manually**

```bash
npm run dev
```

In a separate terminal:
```bash
curl -N -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Who won the 2022 FIFA World Cup?"}],"locale":"en"}'
```

Expected output: SSE stream starting with `data: {"id":...}` lines, ending with `data: [DONE]`. Each chunk has `choices[0].delta.content` with text tokens.

- [ ] **Step 3: Test Georgian language detection**

```bash
curl -N -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"ვინ გახდა ჩემპიონი 2022 წლის მსოფლიო თასზე?"}],"locale":"ka"}'
```

Expected: SSE stream where `delta.content` tokens form a Georgian-language response.

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: add OpenRouter chat API route with streaming and extensible system prompt"
```

---

### Task 3: ChatWidget Component

**Files:**
- Create: `components/ChatWidget.tsx`

**Interfaces:**
- Consumes:
  - `POST /api/chat` (Task 2)
  - `ChatWidgetStrings` object (defined below)
- Produces: `<ChatWidget locale={string} strings={ChatWidgetStrings} />` — default export, client component

`ChatWidgetStrings` shape (passed as prop from layout):
```typescript
{
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  thinking: string;
  welcome: string;
  error: string;
  close: string;
  open: string;
}
```

---

- [ ] **Step 1: Create `components/ChatWidget.tsx`**

```typescript
'use client';

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';

export interface ChatWidgetStrings {
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  thinking: string;
  welcome: string;
  error: string;
  close: string;
  open: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  locale: string;
  strings: ChatWidgetStrings;
}

export default function ChatWidget({ locale, strings }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: strings.welcome },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || streaming) return;

    const userMsg: Message = { role: 'user', content: content.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setStreaming(true);

    const assistantPlaceholder: Message = { role: 'assistant', content: '' };
    setMessages([...history, assistantPlaceholder]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          locale,
        }),
      });

      if (!res.ok || !res.body) throw new Error('stream_failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;

          try {
            const parsed = JSON.parse(raw);
            const delta: string | undefined = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  content: next[next.length - 1].content + delta,
                };
                return next;
              });
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: strings.error };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 flex flex-col"
          style={{
            maxHeight: 'min(520px, calc(100dvh - 120px))',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              borderBottom: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              background: 'var(--color-surface-2)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'var(--color-accent)', color: '#07111c' }}
              >
                AI
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {strings.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {strings.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={strings.close}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
              style={{ background: 'var(--color-border-strong)', color: 'var(--color-text-muted)' }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] px-3 py-2 text-sm rounded-2xl"
                  style={{
                    background:
                      msg.role === 'user'
                        ? 'var(--color-accent-dim)'
                        : 'var(--color-surface-2)',
                    color: 'var(--color-text)',
                    border:
                      msg.role === 'user'
                        ? '1px solid var(--color-accent)'
                        : '1px solid var(--color-border)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5',
                  }}
                >
                  {msg.content === '' && streaming && i === messages.length - 1 ? (
                    <span style={{ color: 'var(--color-text-muted)' }}>{strings.thinking}</span>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 p-3 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={strings.placeholder}
              disabled={streaming}
              className="flex-1 text-sm px-3 py-2 rounded-lg outline-none disabled:opacity-50"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border-strong)',
                color: 'var(--color-text)',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
              style={{
                background: 'var(--color-accent)',
                color: '#07111c',
              }}
            >
              {strings.send}
            </button>
          </form>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={strings.open}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{
          background: open ? 'var(--color-surface-2)' : 'var(--color-accent)',
          border: open ? '1px solid var(--color-border-strong)' : 'none',
          color: open ? 'var(--color-text)' : '#07111c',
          boxShadow: '0 4px 24px rgba(34,197,94,0.35)',
        }}
      >
        {open ? (
          <span className="text-lg">✕</span>
        ) : (
          <span className="text-xl">💬</span>
        )}
      </button>
    </>
  );
}
```

- [ ] **Step 2: Start dev server and verify component compiles**

```bash
npm run dev
```

Expected: no TypeScript errors in terminal. The component isn't mounted yet — just verify compilation succeeds.

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/ChatWidget.tsx
git commit -m "feat: add ChatWidget floating chat component with SSE streaming"
```

---

### Task 4: Wire ChatWidget into Layout

**Files:**
- Modify: `app/[locale]/layout.tsx:17-23` (the JSX return block)

**Interfaces:**
- Consumes:
  - `ChatWidget` default export from `components/ChatWidget.tsx` (Task 3)
  - `t.chat` from `Dictionary` (Task 1)
  - `locale` already available in layout (line 13)

---

- [ ] **Step 1: Modify `app/[locale]/layout.tsx`**

Current file content (`app/[locale]/layout.tsx`):

```typescript
import { getDictionary, isLocale } from '@/i18n/config';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { notFound } from 'next/navigation';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  return (
    <>
      <Header locale={locale} t={t} />
      {children}
      <Footer locale={locale} t={t} />
    </>
  );
}

export async function generateStaticParams() {
  return [{ locale: 'ka' }, { locale: 'en' }];
}
```

Replace with:

```typescript
import { getDictionary, isLocale } from '@/i18n/config';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';
import { notFound } from 'next/navigation';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  return (
    <>
      <Header locale={locale} t={t} />
      {children}
      <Footer locale={locale} t={t} />
      <ChatWidget locale={locale} strings={t.chat} />
    </>
  );
}

export async function generateStaticParams() {
  return [{ locale: 'ka' }, { locale: 'en' }];
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: exit 0. `t.chat` is typed from the JSON — adding the section in Task 1 makes this typecheck automatically.

- [ ] **Step 3: Manual smoke test — widget appears**

Open `http://localhost:3001/ka/` in browser.

Expected:
- Green chat button visible bottom-right corner
- Click button → chat window opens
- Welcome message visible in Georgian
- Button remains visible on all pages (navigate to `/ka/football`, `/ka/news`, etc.)
- Widget does NOT re-mount between pages (state persists — message history survives navigation)

- [ ] **Step 4: Manual smoke test — English locale**

Open `http://localhost:3001/en/`.

Expected: placeholder text and welcome message appear in English.

- [ ] **Step 5: Manual smoke test — AI responds**

In chat window, type: `Who won the 2018 FIFA World Cup?`

Expected:
- Message appears in chat
- "Analyzing..." state briefly visible
- Streaming response appears token by token
- Response mentions France

- [ ] **Step 6: Manual smoke test — Georgian query**

Switch to `/ka/` locale. Type: `ვინ გახდა ლიგა ჩემპიონსის ჩემპიონი 2023 წელს?`

Expected: response arrives in Georgian (Manchester City or similar correct answer).

- [ ] **Step 7: Manual smoke test — live data disclaimer**

Type: `What are today's match scores?`

Expected: response explains live data is not yet available, offers to help with general knowledge.

- [ ] **Step 8: Commit**

```bash
git add app/[locale]/layout.tsx
git commit -m "feat: mount ChatWidget in locale layout for persistent cross-page AI chat"
```

---

## Future Extensibility Guide

### Connecting MongoDB Context (Phase N)

When you're ready to feed match/odds/news data from MongoDB into the chatbot:

**1. Create a context builder in `lib/chat-context.ts`:**
```typescript
import { Match, NewsArticle } from '@/lib/types';

export function buildChatContext(data: {
  upcomingMatches?: Match[];
  recentNews?: NewsArticle[];
  locale: string;
}): string {
  // Serialize relevant data as structured text for the system prompt
  // The /api/chat route accepts this as `context?: string`
}
```

**2. Modify `/api/chat/route.ts`** — the `context` parameter is already wired through `buildSystemPrompt(context)`. Just populate it server-side before calling OpenRouter.

**3. Option A — server-side enrichment (recommended):** Fetch MongoDB context inside the API route handler based on query intent detection.

**4. Option B — client passes context:** `ChatWidget` POSTs a `context` string — but this leaks DB structure to the client. Prefer Option A.

No changes needed to `ChatWidget.tsx` or the layout.

---

## Self-Review Checklist

- [x] Spec: floating button bottom-right → Task 3 `fixed bottom-6 right-4 sm:right-6`
- [x] Spec: persists across pages → Task 4 mounts in shared layout, not per-page
- [x] Spec: no live data / explains limitation → system prompt in Task 2 handles this
- [x] Spec: Georgian + English, same language as user → system prompt language rule
- [x] Spec: never guarantee bets → system prompt betting rules
- [x] Spec: future MongoDB extensibility → `CONTEXT_BLOCK` placeholder + extensibility guide
- [x] Spec: "Sportok AI Assistant" identity → system prompt + widget header
- [x] i18n: both JSON files updated → Task 1 Steps 2 and 3
- [x] API key never hardcoded → env var only, `.env.local`
- [x] `Dictionary` type auto-extends → confirmed via `i18n/config.ts` line 19
- [x] CSS tokens used throughout → `--color-*` variables in ChatWidget
- [x] Client component receives serializable props only → `locale: string`, `strings: ChatWidgetStrings`
