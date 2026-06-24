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
