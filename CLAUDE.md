# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server on port 3001
npm run build    # production build
npm run lint     # ESLint
```

No test suite yet. Typecheck: `npx tsc --noEmit`.

## Architecture

**Next.js 16 App Router** with `[locale]` dynamic segment for i18n. All routes live under `app/[locale]/`. The root `app/layout.tsx` is a minimal shell; `app/[locale]/layout.tsx` does the real work: validates locale, loads translations, renders `Header` + children + `Footer`.

**Locale routing:** `proxy.ts` is the middleware (exports `proxy` + `config` — Next.js 16 picks this up as middleware). It redirects bare paths to `/ka/...` or `/en/...` based on `Accept-Language`. Default locale is `ka` (Georgian).

**i18n pattern:** `i18n/config.ts` exports `getDictionary(locale)` (server-only). Every page and layout calls this and passes the `t` dict down to components. All UI strings must exist in both `messages/ka.json` and `messages/en.json`. Never hardcode display strings.

**Data types:** `lib/types.ts` defines all domain types. Every bilingual field is `{ ka: string; en: string }` — `Team.name`, `Match.preview`, `NewsArticle.title/excerpt/body`, etc. When accessing content, always do `field[locale]`.

**Data layer:** currently 100% mock data in `lib/mock-data.ts`. Pages import `mockData` directly. Future phases replace this with MongoDB API routes — see `plan.md`.

**Component props pattern:** components receive `locale: string` and `t: Dictionary` explicitly. No context or hooks for i18n — it's all prop-drilled from the server layout.

**Image sources:** Wikimedia and Unsplash only (configured in `next.config.ts` `remotePatterns`). Add new domains there before using `<Image>`.

**Styling:** Tailwind CSS 4 with CSS custom properties for theme tokens (`--color-bg`, `--color-accent`, `--color-border`, etc.) defined in `app/globals.css`. Dark theme only.

## Roadmap

See `plan.md` for the 8-phase development plan. MVP design is frozen — do not modify existing components, layout, or styles unless a task in `plan.md` explicitly calls for it.
