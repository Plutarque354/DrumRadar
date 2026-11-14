# WORK BUILD PROMPT — DrumRadar v1.0 (First Testable Live-Data Version)

> **How to use:** Attach `DrumRadar_Documentation_v1.0.zip` to a new **ChatGPT Work** project/task, then paste this entire prompt. This document is an executable product brief, not a request for another planning exercise.

## YOUR ROLE AND GOAL

Act as a senior full-stack JavaScript engineer, product designer and QA lead. **Build** a complete, runnable, GitHub-ready **DrumRadar v1**, a personal Instagram Reel research web app for a drummer. This is a production-minded **first testable version**, not a screenshot or mockup.

Read the attached specification documents in full. Treat `README.md`, `docs/01`–`docs/12`, and `DECISIONS.md` as the implementation contract; this prompt resolves priorities where needed. Make reasonable minor choices and document them without repeatedly asking for design decisions. The user will open the project in **WebStorm**, review locally, and push manually to a newly created GitHub repository. Deliver a **ZIP of the actual source code** and concise setup instructions, plus a truthful QA/test and live-pilot report.

**MOST IMPORTANT:** The first useful build must consume **fresh, authentic Instagram data**, collected on demand from a real provider. Begin with a feasibility and output-schema pilot before building a beautiful but disconnected UI. Do **not** mark the MVP complete if the dashboard only contains sample/demo figures. Do not fabricate views, followers, post timestamps, Reel links, results, live run IDs, API calls, test execution, or source coverage.

## Non-negotiable stack choices

- **Frontend:** semantic HTML5 + modern CSS + **vanilla browser JavaScript ES modules**. Light, fast, polished. Optional tiny, pinned CDN import for icons/charts if justified; preferably browser-native. **No React, Next.js, Vue, Angular, Vite, Webpack, Tailwind build process, or frontend `npm install` needed to open the site.**
- **Gateway:** a minimal JavaScript Cloudflare **Worker** or **Pages Function** that holds the provider API token server-side, authenticates its user, validates inputs, and calls provider APIs with standard `fetch()`. **No Python, FastAPI, Selenium, Playwright or Puppeteer runtime** for the MVP. No full Node server required to keep the application running.
- **Data:** local IndexedDB for watchlist/settings/scans/Reels/metrics/favorites; JSON/CSV export with safe escaping; no database server required for single-user MVP.
- **Provider priority:** [`deepmine/instagram-scraper`](https://apify.com/deepmine/instagram-scraper) through the **Apify REST API**, subject to a **real, permission-appropriate small pilot**. Its advertised inputs include `resultsType: reels/details`, `usernames`, `directUrls`, `resultsLimit`, `onlyPostsNewerThan`; documented outputs include `videoPlayCount`, `videoViewCount`, `timestamp`, `likesCount`, `commentsCount`, `hashtags`, `ownerUsername` and profile `followersCount`. Verify actual present fields against a real run; the actor is relatively new and community-maintained.
- Keep the data-source adapter replaceable. If DeepMine fails coverage/reliability/authorization requirements, assess an allowed alternative such as `apify/instagram-scraper` or the official Meta Business Discovery API. Do not silently switch or bypass restricted access.
- Do not put `APIFY_TOKEN`, access passwords, or any private key in HTML, browser JavaScript, frontend config, local storage, ZIP, logs, GitHub, or URL parameters. Use Worker secrets. All paid endpoints require owner auth (prefer Cloudflare Access, with an explicitly documented securely configured owner-token fallback for private use). Require server-enforced cost/input caps.

## STEP 1: Source feasibility and live pilot — FIRST, before major UI work

Research the **current** DeepMine Actor input/output schema and price from its Apify page; consult official Apify REST API endpoints and account access/permissions. Do not assume the provided documentation's vendor fields are permanent. Prepare/execute, **only if authorized credentials are actually accessible**, small capped on-demand jobs against:

- `slrnoise`
- `brycewestondrums`
- `lukehollandd`
- Separate exact Reel reference: `https://www.instagram.com/reel/DTsrSE2Dm9R/`

Use two independent Actor job modes: `reels` for post data, `details` for profile followers. Start with ≤5–10 Reels/account and a transparent hard cost ceiling. For Reel mode, request enough older range from provider to avoid date-rounding omissions; enforce the precise **48-hour or 72-hour UTC rolling publication window in our own code**. Pinned or old posts must not appear in current-window leaderboards. The direct example Reel may be old; show it in a separate reference-inspection area, not in recent rankings unless in window.

Record per source: access status, provider run ID, provider metric field availability and semantics, number of Reels returned, timestamps, follower count presence, caption/hashtag completeness, exact Reel permalinks, actual provider-reported bill if available, run status and coverage errors. Verify a sample of rows with their original Instagram URLs when feasible. **Do not claim any scan occurred if no real token or connection was available.**

**If credential/access is missing:** Implement the complete live integration and a clear guided setup/configuration flow; do not request the token in public chat, hardcode it, or simulate a completed live scan. Provide a prominent `Live source not configured` state, an optional unmistakably labeled **Demo mode** for UI testing, and a `BLOCKED ON APIFY CONFIGURATION` acceptance report. The code must be ready to test the moment the owner provisions the key in Cloudflare secrets. If a provider fails, preserve error evidence and don't claim success. Prefer small useful partial completion over another design-only document.

## STEP 2: Build the secure minimal live-data architecture

Create a static frontend and minimal JS Worker/Pages Function with:

- A health/configured endpoint.
- Authenticated paid `POST /api/scans` with selected usernames, lookback hours, per-account limit, cost ceiling and optional direct Reel URL; validate handles/URLs, count caps, input sizes, actor allowlist and user auth at server, not only client.
- Starts **asynchronous** Apify `reels` and `details` runs (API pattern: `POST /v2/acts/deepmine~instagram-scraper/runs`), returning stable scan anchor UTC, source, run IDs and safe signed tickets or durable associations; handle partial start.
- `GET /api/runs/:runId/status` and `GET /api/runs/:runId/items` with ticket/owner validation, bounded pagination, no arbitrary dataset access, safe errors and no credentials in responses. Use `Authorization: Bearer <APIFY_TOKEN>` only from Worker.
- Proper status transitions, failure messages, partial runs, 429/5xx backoff, no automatic billable retry, explicit freshness and last-observed time, recoverable scan records in IndexedDB.
- Protected production same-origin hosting where practical. For local WebStorm's HTTP preview, document a precise safe development API URL and CORS allowlisted origin; **do not** solve CORS by exposing Apify credentials or unauthenticated public paid endpoints.

Cloudflare Workers are stateless. Don't put job state solely in global Worker variables. Use signed tickets tied to owner and provider run IDs, or minimal KV/D1 if required for safe run binding; choose the smallest secure testable option and document tradeoffs. Prevent double-click accidental duplicate paid runs; cross-tab/multi-device lock requirements can be a documented enhancement if server KV isn't used, but never create a new billable scan automatically on polling retries.

## STEP 3: Data model and correctness rules

Implement pure, independently tested functions/modules for `normalize`, `analytics`, `hashtags`, `time`, `storage`, `csvExport`, and `providerAdapter`.

- Distinguish exact **Reel** ID/shortcode, creator handle, original permalink, `publishedAtUtc`, `observedAtUtc`, provider run/source, `videoPlayCount`, `videoViewCount`, `likesCount`, `commentsCount`, current observed follower count, caption, tags, optional music and thumbnail.
- Never invent metric values. `null`/hidden/absent ≠ `0`; a real `0` is valid.
- Keep *plays* and *views* separate, never mix counter types in one metric without an explicit labeled selector. Prefer `playCount` and label rankings **plays** if actor supports it consistently.
- Join each Reel to the correct creator's profile follower observation; if missing or denominator 0, leave follower-normalized rankings unavailable but show the Reel in Explorer.
- Dedupe by canonical media ID/shortcode; preserve a provenance trace.
- `scanStartedAtUtc` anchors exact rolling window; `publishedAtUtc` selects only recently **posted** Reels; the likes/views shown are **cumulative at collection time**, not likes/views earned during that 48/72h window.
- Timezone: viewer-local from browser; creator-local only from an explicitly set **IANA time zone** per account, converted with `Intl.DateTimeFormat`; otherwise show **Creator timezone unknown**. Do not guess creator location.
- Normalize all hashtags in full captions plus actor-provided arrays (Unicode, lowercase NFC, dedupe once/Reel). Keep original display form, include all observed unique tags.

## STEP 4: UI implementation — polished, friendly, fast

Retain the approved design direction: airy modern analytics dashboard, muted light background, tasteful teal accents, cards, clear metrics and sorting. Responsive desktop/tablet/mobile, accessible keyboard behavior, graceful loading, empty/error states. Implement:

### Overview

- KPI summary: requested/scanned creators, retrieved/in-window Reels, all observed unique tags, data completeness, last updated time, live/cached/demo source.
- **Three separate top-10 Reel leaderboards, each ranked by exact video**:
  1. Most absolute plays/views.
  2. Highest plays/views **per follower** multiplier.
  3. Highest **observable engagement per follower**, defined as `(likes + comments) / followers × 100`.
- Each entry links to the original Reel and shows creator, metric components, publication date/time, data freshness. A Reel can appear in multiple boards. Show fewer than 10 if data insufficient; include eligibility counts.

### Hashtag Intelligence — EXHAUSTIVE

- **Every observed tag** in sampled recent Reels, not just a counter + 3 badges, all-rows CSV export, pagination/search/sort/tier filter, linked list of every observed Reel using that tag.
- Columns: hashtag, tier, Reel usage count, distinct creators, sample share, median plays/follower, median engagement/follower, eligible sample sizes, newest observed Reel.
- Tier gate: `<3` eligible engagements or `<2` distinct creators → **Provisional**, always visible. Otherwise determine relative empirical S/A/B/C/D tiers from eligible tags, using documented transparent percentile boundaries and deterministic sorting (see `docs/06_ANALYTICS.md`). Explain sample-size limits; do not suggest these tags are proven to cause engagement.
- **Avoid false Instagram-wide 'trending' claims**. Without historical comparable scans, label as `High-performing in monitored sample`, not as global trends; future momentum analysis is P1.

### Reels Explorer

- Complete filtered/sorted Reel list, caption and hashtags, links, thumbnails with broken-image fallback, metrics, both plays and views where available, Reel source/run metadata, posting UTC/viewer time/configured creator time, save as idea, search/filter by creator/tag/date.
- Independent exact Reel reference inspector for supplied sample video URL.

### Creators

- Prepopulate the three provided accounts; add/remove/reorder/enable/disable, category and priority, multi-select, configurable IANA timezone, last observed followers, readable account status. Persist in IndexedDB.

### Scan Control

- Number of accounts selection **10 / 25 / 50 / Custom**, but allow all 3 seeded accounts during pilot; the UI must never suggest more accounts are selected than actually on watchlist.
- Lookback **48h / 72h / custom**; per-account Reel limit; source selection/status; optional direct video inspection; server-capped estimated cost; confirm before paid run; manual **Start live scan**; progress state, user-friendly failures, no automatic new billable retries.

### Saved Ideas & History

- Bookmark Reels, personal notes and editable labels; persist across refresh, export JSON; historical scan list with timestamps/source/status and cached data labels. Ensure no user data stored in a third-party account without need.

## STEP 5: Tests, security review and honest release evidence

Include runnable automated pure-function and gateway tests as appropriate, plus manual test checklist. **Do not** add a frontend runtime build requirement; using Node's built-in `node:test` for development tests is acceptable. At minimum test:

- Engagement ratio and view multiplier math.
- Missing likes/comments/followers as null (never zero), real zero counts.
- Views vs plays semantic separation.
- UTC 48/72h boundaries; old pinned Reel exclusion; invalid timestamps.
- IANA timezone and DST conversion; unknown creator time zones.
- Unicode hashtags, duplicate tags, 100+ tags, all-rows exports, low-evidence provisional tiers.
- Reel deduplication, stable tie ranking, fewer than 10 eligible posts.
- Direct Reel out-of-window not counted in current Top 10.
- Auth, actor allowlist, handle/URL input validation, cost caps, secret leakage, safe dataset tickets, status failure paths, pagination, stale-data labeling and no unpaid-vs-paid retry confusion.
- Browser UX at 1440/768/390 widths, keyboard access, favorites persistence, CSV formula injection prevention, broken thumbnails.

Run real tests in your available environment and report **which tests you executed**, exact outcome, and any that remain untested. Any missing credential or compliance blocker should be stated clearly, not bypassed.

## Deliverables — produce actual files, NOT just a response

1. `DrumRadar_v1_testable.zip` containing an actual runnable project: static HTML/CSS/ESM frontend; Cloudflare Worker/Pages Function; provider adapter; IndexedDB store; tests; nonsecret fixtures; `.gitignore` and any Worker deployment config; README and brief deployment instructions.
2. A real `README.md` with exact WebStorm open/run steps; Cloudflare setup (including owner auth, Worker secrets and development origin), Apify account and token configuration, how to start the pilot, cost controls, expected UI states, commands only if actually needed, GitHub push workflow, source/terms limitations.
3. `PILOT_REPORT.md`: actual run IDs, provider data coverage, observed cost, test handles and Reel link results **if and only if a real pilot was executed**; otherwise `NOT EXECUTED — missing credential/access` with explicit instructions and required actions.
4. `TEST_REPORT.md`: automated + manual tests with pass/fail/blocked, exact steps and honest evidence.
5. A concise response with project ZIP link, file tree, screenshots if actually created, what works right now, and what the user must configure to get live data.

## Completion criteria / Definition of Done

**Do not say 'finished live MVP'** unless authenticated on-demand collection actually returns real Instagram Reel data through the secret-safe API, with real source URLs and timestamps, three separate Reel-level leaderboard calculations, exhaustive observed hashtag inventory, proper time-zone handling, honest missing-data logic, controlled costs and no hardcoded secrets. If live source requires the owner's Apify token, deliver the otherwise functional testable project now and mark the live test as **blocked pending private credential setup**; no demo-only build should be represented as a complete live product.

**Prioritize working code and a truthful partial deliverable over further planning.** Keep the implementation lightweight, extensible and easy to run in WebStorm. Do not silently make the user install large UI libraries or a local scraping runtime.
