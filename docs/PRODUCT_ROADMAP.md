# SumItUp — UX, Features & Production Roadmap

Suggestions to evolve SumItUp from a capable prototype into a **production-grade** product.

## UX improvements (high impact)

| Idea | Why it matters |
|------|----------------|
| **Onboarding carousel** | Explains content types, tokens, and privacy in 3 screens. |
| **Progress states** | Multi-step UI: upload → processing → summary, with cancel and retry. |
| **Summary controls** | Short / medium / detailed and bullet vs paragraph — wired to user preferences API. |
| **Empty & error states** | Friendly copy when history is empty or network fails, with offline hint. |
| **Dark/light theme** | Match `UserPreferences.theme`; respect system setting. |
| **Haptic + sound toggles** | Optional feedback when summary completes. |
| **Share sheet** | Export summary as text, PDF, or link to saved content. |
| **Accessibility audit** | VoiceOver/TalkBack labels on all tappable cards; 44pt min touch targets; contrast ≥ 4.5:1 for body text. |

## Functionality for real users

### Core product

- **Offline queue** — Queue uploads when offline; sync when connected.  
- **Background processing** — Webhook or push notification when long video/PDF jobs finish.  
- **Batch upload** — Multiple PDFs or URLs in one session.  
- **Language detection** — Auto-detect and summarize in user’s preferred language.  
- **Citation mode** — Link summary bullets back to source sections (PDF page, URL anchor).  
- **Compare summaries** — Side-by-side two URLs or two versions of same doc.

### Trust & account

- **Email verification gate** — Block summarize until verified (configurable).  
- **2FA (TOTP)** — Optional for security-conscious users.  
- **Account deletion & data export** — GDPR-style self-service.  
- **Session list** — Revoke devices.

### Monetization (if desired)

- **Subscription tier** — Unlimited summaries, no ads, higher file size.  
- **Fair token economy** — Transparent costs per content type; daily free tier.  
- **Team workspace** — Shared history and admin billing.

## Production engineering

| Area | Recommendation |
|------|----------------|
| **Hosting** | API on container platform (Fly.io, Railway, ECS); MongoDB Atlas; CDN for static assets. |
| **Secrets** | JWT and API keys in vault; rotate regularly. |
| **Observability** | Structured logs (pino), metrics (latency per content type), error tracking (Sentry). |
| **CI/CD** | GitHub Actions: lint, test, coverage gate (≥80%), CodeQL (already present). |
| **Load** | Job queue (BullMQ + Redis) for video/PDF; separate workers from API process. |
| **Dependencies** | `npm audit` remediation plan; pin Node LTS (20/22) in `.nvmrc`. |
| **E2E** | Detox or Maestro for critical flows: login → URL summary → save history. |

## Metrics that matter

- Time-to-summary (p50/p95) by content type  
- Summarization success rate vs user-reported “bad summary”  
- D7 retention after first summary  
- Token earn/spend balance (economy health)  

## Suggested phased rollout

**Phase 1 (MVP polish)** — Onboarding, progress UI, preferences wired, accessibility pass, SSRF-safe URL, auth on all paid paths.  

**Phase 2 (Retention)** — Push notifications, favorites/search UX, share/export, dark mode.  

**Phase 3 (Scale)** — Job queue, subscriptions, teams, multilingual models (OpenAI/AssemblyAI with fallbacks).  

---

For current capabilities, see [FEATURES.md](./FEATURES.md).
