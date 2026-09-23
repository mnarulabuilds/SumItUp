# SumItUp — Features & configuration

## Real processing (no mock summaries)

| Content | Pipeline |
|---------|----------|
| **URL** | Safe fetch (SSRF checks) → HTML extraction → summarization |
| **PDF / Book** | File parse → text → summarization |
| **Image / GIF** | Visual classification → text → summarization |
| **Audio / Video / Meeting** | **AssemblyAI** transcription → summarization |

Set in `backend/.env`:

```env
ASSEMBLYAI_API_KEY=...
OPENAI_API_KEY=...          # optional; improves summary quality when set
OPENAI_SUMMARY_MODEL=gpt-4o-mini
```

Without `ASSEMBLYAI_API_KEY`, audio/video/meeting requests return **503** with a clear configuration message.

## Meeting summaries

- Home → **Meeting** → optional title + upload recording (audio/video).
- API: `POST /api/summary/generate/meeting` with `{ meetingData: { recordingFileName, title? } }`.
- Uses long-form **insights** style summaries.

## Monetization

- **Tokens** — watch ads (`POST /api/token/earn`) or subscription grants.
- **Wallet** — demo top-up (`POST /api/billing/wallet/top-up`); integrate Stripe for production.
- **Plans** — `GET /api/billing/plans`, subscribe via `POST /api/billing/subscribe`.
- **Donations** — `POST /api/donations` (deducts wallet balance; ledger stored in MongoDB).

Profile screen in the app exposes wallet, ads, plans, and donations.

## Search

- `GET /api/search/fuzzy` — searches **your saved content** (auth required).
- `GET /api/search/books` — searches saved book-type content.

## Accessibility

- WCAG-oriented colors in `frontend/src/theme/a11y.ts`.
- Minimum **44pt** touch targets on primary actions.
- `accessibilityRole` / `accessibilityLabel` on main controls.

## Settings

- **Settings** screen: summary length, style, theme preference (synced to `/api/user/preferences`).
