# Frontend UI/UX Redesign — Premium AI SaaS

## Goals
Transform the app into a premium SaaS-style AI platform (ChatGPT/Claude/Perplexity quality).
Dark theme, accent `#10A37F`, fully responsive, no backend changes.

## Progress

- [x] Review existing architecture (chat components, styles, routing)
- [x] Additive backend: file-extraction middleware + service (non-breaking, powers 📎 Upload)
- [x] Additive backend: chat.controller + chat.service + chat.routes accept optional file
- [x] Frontend API: `streamSendMessageWithFile` added
- [x] Global design tokens (style.scss) — accent, typography, scrollbars
- [x] Chat page layout (sidebar + main, responsive)
- [x] Sidebar redesign (logo, new chat, search, history, profile, settings, logout, collapsible)
- [x] Chat input redesign (multi-line auto-expand, upload/voice/send)
- [x] Message bubbles redesign (user gradient right, AI cards)
- [x] Welcome screen (heading, subtitle, suggestion cards, recent chats)
- [x] Suggestion cards (animated cards)
- [x] Skeleton / typing indicator polish
- [x] Responsive (mobile drawer sidebar)
- [x] Verify build & no regressions

