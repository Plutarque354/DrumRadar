# 03 — Architecture: No Heavy Frontend, No Python Server

## System choice

```
WebStorm built-in static file server / deployed static host
  └─ index.html + styles/*.css + js/*.js (browser-native ESM; IndexedDB)
        │ HTTPS fetch() (same-origin in production)
        ▼
Cloudflare Worker / Pages Function (plain JS, no app framework)
  ├─ owner authentication (Cloudflare Access preferred, strong owner token fallback)
  ├─ CORS / origin validation for local WebStorm testing
  ├─ strict inputs, fixed actor allowlist, cost caps
  ├─ secret APIFY_TOKEN binding (never browser JS)
  ├─ start Actor jobs (Reels and Profile details)
  ├─ poll status and retrieve paginated datasets
  └─ normalize results (or forward strictly sanitized rows)
        ▼
Apify REST API → deepmine/instagram-scraper
```

This is still a **static, dependency-light frontend**. The Worker is the smallest viable security boundary for private provider credentials and spend limits. Direct browser-to-Apify calls would expose the API token. Browser-side Selenium/Playwright cannot execute like a static CDN import to scrape cross-origin Instagram because of browser-origin restrictions and automation runtime requirements.

## Strict constraints

- No `package.json` required for frontend (optional if developer uses optional test tooling, but no UI framework or bundle prerequisite).
- No npm runtime library, Python/FastAPI, Selenium, Puppeteer, Playwright required by production MVP.
- Do not include CDN scripts merely for design decoration; a single optional pinned CDN icon/chart library is acceptable, but native HTML/CSS/JS preferred.
- Worker uses standard JS `fetch`, Web Crypto (`crypto.subtle`) where needed, and Cloudflare secrets; no Apify SDK is necessary.
- Host static files and Worker under same origin for production. During WebStorm development use the built-in local server and explicitly configure a safe development gateway URL and allowlisted origin — **never** unrestricted CORS + publicly callable spend endpoint.

## Responsibilities

**Browser**: watchlist settings, scan control, presentation, client-only analytics, IndexedDB persistence, CSV/JSON exports, saved notes. Never contain `APIFY_TOKEN`, Cloudflare secret, or embedded production owner password.

**Worker**: authenticate owner; validate/cap inputs; launch actor runs; return run IDs/tickets; poll provider; return only required normalized fields and error statuses; ensure CORS and secrets; handle rate limit and cost guardrail; record no user secrets in logs. Optionally store minimal scan-run metadata in Cloudflare KV/D1 later.

**Apify**: perform data collection; different result modes for Reel entries and creator follower profiles. Its outputs and costs can change and must be verified during pilot.

## State and lifecycle

A scan consists of a stable `scanStartedAtUtc` (captured before starting jobs) and typically two asynchronous Apify jobs:

1. `reels`: `resultsType: reels`, `usernames`, `resultsLimit`, `onlyPostsNewerThan` (coarse provider filter), `skipPinnedPosts: false` (then filter exact timestamps locally);
2. `details`: `resultsType: details`, `usernames`, get observed follower counts and timestamps.

For the optional historical example Reel, launch a small independent exact-URL `reels` job or provide manual user-import fallback. **Do not include its out-of-window metrics in the selected-window Top 10.**

The Worker returns run ticket(s). The frontend saves them in IndexedDB so the scan can resume after reload, polls controlled Worker endpoints, fetches result pages, normalizes/deduplicates by Instagram media id/shortcode, joins Reel owner to profile (casefold username or owner ID if available), computes analytic metrics, and saves an immutable scan snapshot. Jobs can fail separately; mark `PARTIAL` and provide meaningful subsets, never claim a full scan.

## Durable coordination tradeoff

Cloudflare Workers are stateless between invocations. **Do not store progress only in Worker global variables.** For a private single-user first version, browser-held run tickets + provider run status is an acceptable minimal solution. However:

- A lost browser session should be recoverable from IndexedDB; multi-device run history is not guaranteed.
- To prevent arbitrary run enumeration, sign or bind run ticket claims to owner authentication and verify before proxying provider results, or use server-side KV records keyed to scan ID.
- To guarantee paid scan idempotency across tabs and browsers, adopt Cloudflare KV/D1 and an owner-level active-run lock; absent that, clearly label duplicate-run caveat and use client-side pending locks with explicit confirmation.
- Production deployment should ideally protect the entire app by Cloudflare Access; an owner-token fallback must be entered at runtime, not compiled into source.

## Time and freshness

`scanStartedAtUtc` = anchor for rolling lookback; `observedAtUtc` = when provider data was retrieved. Keep them separate from `publishedAtUtc`. A fresh run is not proof that every public Reel or profile field was successfully collected. Provider may return pinned/outdated posts; exact filter must be in application code.

## Media handling

Render provider-approved thumbnail URLs only with safe URL checks and fallbacks; prefer original Instagram permalinks. Do not attempt browser download of MP4s or store third-party media by default. Signed media URLs may expire.

## File tree target

```
drumradar/
  index.html
  css/{base,layout,components}.css
  js/{app,api,store,normalize,analytics,hashtags,time,export,ui}.js
  worker/index.js                  # one small JS source or Pages Function equivalent
  tests/{analytics,normalization,timezone,provider-contract}.*
  fixtures/{sanitized-provider-samples}.json
  README.md
  docs/...
  .gitignore
```

Work may adjust file names as long as the functions, no-build frontend, and documentation remain intact. A separate deployment `wrangler.toml`/`wrangler.jsonc` is acceptable, but no heavyweight build step should be required to simply open and test the frontend.
