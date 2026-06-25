'use client';

import { useState, useRef, useEffect, useCallback, FormEvent, KeyboardEvent } from 'react';
import type { ReactNode } from 'react';
import { MessageCircle, X, Send, Square } from 'lucide-react';

const CHAR_LIMIT = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatWidgetStrings {
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  stop: string;
  thinking: string;
  welcome: string;
  error: string;
  close: string;
  open: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  locale: string;
  strings: ChatWidgetStrings;
}

// ---------------------------------------------------------------------------
// Minimal markdown renderer
// Handles: ## / ### headings, **bold**, *italic*, `code`, - / * bullets, 1. lists
// Intentionally limited — covers GPT-4o-mini's typical output without a heavy dep.
// ---------------------------------------------------------------------------

function parseInline(text: string): ReactNode {
  // Order matters: match ** before * to avoid greedy single-star on bold
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
          return <em key={i}>{part.slice(1, -1)}</em>;
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
          return (
            <code
              key={i}
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '3px',
                padding: '0 4px',
                fontFamily: 'monospace',
                fontSize: '0.88em',
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        return part;
      })}
    </>
  );
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H2
    if (line.startsWith('## ')) {
      nodes.push(
        <p
          key={key++}
          style={{ fontWeight: 700, marginBottom: '0.15em', marginTop: nodes.length ? '0.6em' : 0 }}
        >
          {parseInline(line.slice(3))}
        </p>,
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith('### ')) {
      nodes.push(
        <p
          key={key++}
          style={{ fontWeight: 600, marginBottom: '0.15em', marginTop: nodes.length ? '0.4em' : 0 }}
        >
          {parseInline(line.slice(4))}
        </p>,
      );
      i++;
      continue;
    }

    // Unordered list — collect consecutive bullet lines
    if (/^[-*] /.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(<li key={i}>{parseInline(lines[i].slice(2))}</li>);
        i++;
      }
      nodes.push(
        <ul key={key++} style={{ paddingLeft: '1.15em', margin: '0.2em 0', listStyleType: 'disc' }}>
          {items}
        </ul>,
      );
      continue;
    }

    // Ordered list — collect consecutive numbered lines
    if (/^\d+\. /.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i}>{parseInline(lines[i].replace(/^\d+\. /, ''))}</li>);
        i++;
      }
      nodes.push(
        <ol key={key++} style={{ paddingLeft: '1.15em', margin: '0.2em 0' }}>
          {items}
        </ol>,
      );
      continue;
    }

    // Blank line → small spacer (only if there's already content)
    if (line.trim() === '') {
      if (nodes.length > 0) {
        nodes.push(<div key={key++} style={{ height: '0.35em' }} />);
      }
      i++;
      continue;
    }

    // Regular paragraph line
    nodes.push(
      <p key={key++} style={{ margin: '0.1em 0' }}>
        {parseInline(line)}
      </p>,
    );
    i++;
  }

  return <>{nodes}</>;
}

// ---------------------------------------------------------------------------
// ChatWidget
// ---------------------------------------------------------------------------

export default function ChatWidget({ locale, strings }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: strings.welcome },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // True when the viewport is at (or near) the bottom of the message list
  const shouldAutoScrollRef = useRef(true);
  const msgCounterRef = useRef(0);

  // Abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Focus input when chat opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Scroll to bottom when messages update, but only if the user hasn't scrolled up
  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Blinking cursor while streaming — cursor span is only rendered when streaming=true,
  // so cursorVisible value is irrelevant when streaming is false.
  useEffect(() => {
    if (!streaming) return;
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, [streaming]);

  // Track whether the user is near the bottom so auto-scroll behaves correctly
  const handleScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    shouldAutoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || streaming) return;

      const userMsg: Message = {
        id: `msg-${++msgCounterRef.current}`,
        role: 'user',
        content: content.trim(),
      };
      // Build history including the new user message
      const history = [...messages, userMsg];
      setMessages(history);
      setInput('');
      setStreaming(true);
      // Force scroll to bottom when the user sends
      shouldAutoScrollRef.current = true;

      const placeholderId = `msg-${++msgCounterRef.current}`;
      setMessages([...history, { id: placeholderId, role: 'assistant', content: '' }]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Send full conversation history for multi-turn context
            messages: history.map(({ role, content: c }) => ({ role, content: c })),
            locale,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error('stream_failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        // Buffer handles SSE events that span multiple read() chunks
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep the last (potentially incomplete) line in the buffer
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') continue;

              try {
                const delta: string | undefined =
                  JSON.parse(raw).choices?.[0]?.delta?.content;
                if (delta) {
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    next[next.length - 1] = {
                      ...last,
                      content: last.content + delta,
                    };
                    return next;
                  });
                }
              } catch {
                // Malformed SSE chunk — skip silently
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // User stopped streaming — remove placeholder if no content arrived yet
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant' && last.content === '') {
              return prev.slice(0, -1);
            }
            return prev;
          });
          return;
        }
        // Network or parse error — show error in the assistant slot
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: strings.error,
          };
          return next;
        });
      } finally {
        setStreaming(false);
      }
    },
    [streaming, messages, locale, strings.error],
  );

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

  const remainingChars = CHAR_LIMIT - input.length;
  const showCharCounter = remainingChars <= 100;

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Chat window                                                          */}
      {/* ------------------------------------------------------------------ */}
      {open && (
        <div
          role="dialog"
          aria-label={strings.title}
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col"
          style={{
            width: 'min(400px, calc(100vw - 2rem))',
            maxHeight: 'min(560px, calc(100dvh - 120px))',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 16px 56px rgba(0,0,0,0.72)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--color-accent)', color: '#07111c' }}
              >
                AI
              </div>
              <div>
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: 'var(--color-text)' }}
                >
                  {strings.title}
                </p>
                <p className="text-xs leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                  {strings.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={strings.close}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            onScroll={handleScroll}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0"
          >
            {messages.map((msg, i) => {
              const isLastStreaming = streaming && i === messages.length - 1;
              const isEmpty = msg.content === '';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}
                >
                  {/* Assistant avatar */}
                  {msg.role === 'assistant' && (
                    <div
                      aria-hidden="true"
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ background: 'var(--color-accent)', color: '#07111c' }}
                    >
                      S
                    </div>
                  )}

                  <div
                    className="max-w-[82%] px-3 py-2 text-sm"
                    style={{
                      borderRadius:
                        msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                      background:
                        msg.role === 'user'
                          ? 'var(--color-accent-dim)'
                          : 'var(--color-surface-2)',
                      color: 'var(--color-text)',
                      border:
                        msg.role === 'user'
                          ? '1px solid rgba(34,197,94,0.35)'
                          : '1px solid var(--color-border-strong)',
                      lineHeight: '1.6',
                    }}
                  >
                    {/* Thinking placeholder: only when content is still empty */}
                    {isEmpty && isLastStreaming ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>{strings.thinking}</span>
                    ) : (
                      <>
                        <MarkdownContent text={msg.content} />
                        {/* Blinking cursor while content is streaming in */}
                        {isLastStreaming && (
                          <span
                            aria-hidden="true"
                            style={{
                              display: 'inline-block',
                              width: '2px',
                              height: '0.82em',
                              background: 'var(--color-text-muted)',
                              marginLeft: '2px',
                              verticalAlign: 'text-bottom',
                              opacity: cursorVisible ? 1 : 0,
                              transition: 'opacity 0.1s',
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} aria-hidden="true" />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="px-3 pb-3 pt-2 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={strings.placeholder}
                disabled={streaming}
                maxLength={CHAR_LIMIT}
                autoComplete="off"
                className="flex-1 text-sm px-3 py-2 rounded-lg outline-none disabled:opacity-50"
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text)',
                  minWidth: 0,
                }}
              />

              {streaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  aria-label={strings.stop}
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border-strong)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <Square size={13} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label={strings.send}
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-opacity disabled:opacity-30 hover:opacity-80"
                  style={{ background: 'var(--color-accent)', color: '#07111c' }}
                >
                  <Send size={14} />
                </button>
              )}
            </div>

            {showCharCounter && (
              <p
                className="text-xs mt-1 text-right pr-1"
                style={{
                  color: remainingChars <= 20 ? 'var(--color-danger)' : 'var(--color-text-dim)',
                }}
              >
                {remainingChars}
              </p>
            )}
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Floating action button                                              */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? strings.close : strings.open}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          background: open ? 'var(--color-surface-2)' : 'var(--color-accent)',
          border: open ? '1px solid var(--color-border-strong)' : 'none',
          color: open ? 'var(--color-text-muted)' : '#07111c',
          boxShadow: open
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(34,197,94,0.28)',
        }}
      >
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
