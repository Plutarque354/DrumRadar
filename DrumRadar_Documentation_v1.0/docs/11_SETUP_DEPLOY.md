# 11 — Setup and Deployment Guide (Work must finalize with working paths)

## Prerequisites

- WebStorm or any editor capable of serving static files over local HTTP (WebStorm built-in preview/server is sufficient).
- Git/GitHub (user plans to push manually).
- Apify account with an API token and sufficient quota/credits. The token is **not provided here**.
- Cloudflare account for a minimal Worker/API gateway; choose a deployment route exposing your HTTPS static files and gateway on same origin for easiest production usage.
- Confirm rights to collect relevant Instagram data via the provider/API before beginning real scans.

## Open frontend locally

1. Clone/extract the built repository in WebStorm.
2. Serve `index.html` through WebStorm's built-in browser preview/local HTTP server (port often 63342, but check actual origin).
3. Set frontend gateway base URL in a **nonsecret** config (e.g., `window.DRUMRADAR_API_BASE = 'https://<your-worker-host>'`). This config may be public; **never add APIFY_TOKEN**.
4. For local live testing, the deployed gateway must specifically allowlist the actual WebStorm origin and require owner authentication; raw `file://` preview does not count.
5. For production, serve UI and gateway from same origin (or explicitly configured CORS) and protect paid endpoints.

## Set Worker secrets

Worker/Pages settings → **Variables and Secrets**:

- `APIFY_TOKEN` — secret (never plain variable).
- `OWNER_ACCESS_TOKEN` — **optional** only when using manually entered owner token rather than Cloudflare Access.
- `TICKET_SIGNING_KEY` — random strong secret if implementing signed run tickets.
- `ALLOWED_ORIGIN` / `ALLOWED_DEV_ORIGIN` — nonsecret exact origin values (include scheme and port); only include known local origin for development.
- Optional `MAX_SCAN_CHARGE_USD`, `MAX_ACCOUNTS`, `MAX_REELS_PER_ACCOUNT` — server-controlled caps.

All values above are deployment settings. Only nonsecret examples may exist in `.env.example`; `.dev.vars`, `.env`, `.env.production`, session dumps and any key-containing logs must be ignored by Git. Cloudflare dashboard allows secret setup without a full JS backend installation; `npx wrangler` is an optional dev/deployment convenience, not a production dependency.

## Deploy

**Preferred:** Cloudflare Worker/Pages with static assets and secure API routes on the same site. An alternative static host + separate Worker is acceptable if origin allowlist and auth are exact and tested. Worker can be entered via Cloudflare dashboard or deployed with `npx wrangler` if the developer chooses; no need to install a global scraper or framework. Document actual deployed URLs and steps based on implementation choices.

## First-run wizard

1. Health/configuration state detects missing Worker or missing API token and displays instructions.
2. Owner authenticates if access is not already handled by Cloudflare Access.
3. Seed watchlist: `slrnoise`, `brycewestondrums`, `lukehollandd`; optional user-controlled timezone assignment.
4. Owner selects **3** accounts, 72h window, 5–10 Reels/account, capped budget; performs live scan.
5. Display provider run IDs, per-run status, published Reel list (possibly empty if no new posts), returned account followers, complete hashtags within actual sample.
6. Check source links, save notes, export results, then increase cap to 10/25/50 accounts only if desired and financially appropriate.

## Common troubleshooting

- **CORS:** use local HTTP preview, check exact allowed origin, preflight, and auth headers; never solve by exposing provider token client-side.
- **401/403:** authentication or provider key missing; do not print secret in console.
- **Apify actor runs but no eligible Reels:** inspect provider run logs/input status and exact UTC window; possibly no new public posts or source limited.
- **Missing follower counts:** Details mode may have failed or account unsupported; leave ratio boards unranked.
- **Missing/expired images:** source image link expired; show placeholder and original Reel link.
- **Old pinned Reels appear:** filter by actual timestamp in frontend; do not trust feed order.
- **Paid job started twice:** disable duplicate scans, provide status recovery; cross-tab idempotency requires server-side durable lock.

## Repo rules

Include a strong `.gitignore` ignoring `.env*` except nonsecret `.env.example`, `.dev.vars*`, secrets, `.idea` user-specific files, test logs and local downloads. No binary media dumps required. Full docs in `docs/`; tests in `tests/`; explicit `LICENSE` chosen by user if publishing code publicly. Avoid making a repository public with user secrets or large copied third-party media.
