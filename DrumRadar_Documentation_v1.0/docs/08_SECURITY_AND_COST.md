# 08 — Security, Operational Reliability, Cost and Compliance

## Security requirements

**Secrets:** `APIFY_TOKEN` stored as Cloudflare Worker secret, not in `index.html`, browser JS, `.env` committed to Git, CDN parameters, URL querystrings, client storage, error response, or screenshots. Production owner gate: Cloudflare Access recommended; alternative strong `OWNER_ACCESS_TOKEN` entered at runtime and checked server-side, never published in static files. Cloudflare's `env` secret binding is designed for this.

**Server restrictions:** hard-code actor allowlist; validate creator handles and the path of an exact Reel URL; cap number of accounts/results/window; reject any arbitrary URL input, redirects to unrelated hosts, or raw actor commands from frontend; rate-limit/owner lock as feasible; validate CORS allowlist; limit response bytes/pages; no unauthenticated billable scan endpoint.

**Client:** sanitize caption/creator/tag text via textContent, never innerHTML with external data. Safe external links; limit user notes and exported file size; avoid exposing sensitive credential in IndexedDB. Prevent CSV formula execution when exporting hashtags/captions/handles; treat raw rows and metadata as untrusted input.

**Auth flow:** For private single-owner pilot use Cloudflare Access if practical. If an owner secret is necessary for WebStorm local testing, provide secure text input, keep in memory only, clear on reload/logout. Document tradeoff and security checklist. Secrets aren't confidential merely because a repository is private.

## Costs and user control

DeepMine listing inspected 2026-11-13 advertises result-row prices based on Apify plan; actual charge and subscriptions may differ. Display **clearly labeled maximum/estimate**, not guaranteed cost. Server enforces per-job `maxTotalChargeUsd` and `maxItems` when supported; two jobs mean two caps. Suggested pilot: three creators, ≤10 Reels/account, one short exact-Reel test, per-job cap e.g. `$0.25`–`$0.50` configurable subject to current provider restrictions. User clicks to confirm before spending. Avoid aggressive automatic retry; retries may create paid runs. Store actual provider billing data when available, otherwise mark `Cost not yet reported`.

No auto-scan, scheduling, background checking, or continuous paid polling until user opts in and spending controls are tested. Polling provider **status** is allowed; creating new paid actor runs is not.

## Service quality and errors

- Private/removed/renamed accounts, source rate limit, actor failure, incomplete media, aged-out signed thumbnails, missing timestamps/follower counts: handle as distinct states.
- A scan can finish successfully with zero in-window Reels. Display `No recent public Reels found` and coverage notes — not a fabricated leaderboard.
- Record `runId`, source, start/finish, observedAt, failure reasons and counts; no credentials.
- Partial data can be used for explicitly labeled partial rankings; always show coverage exclusions.
- New scan must not overwrite last known valid dataset on failure; present last snapshot as `Cached from <time>`.
- For provider dataset pagination ensure all pages fetched, deduped and capped; records beyond capped provider results are *not* 'complete Instagram account coverage'.
- Do not infer source truth from image URL, filenames or popularity labels.

## Instagram/Meta access policies and legal notes

Instagram's published terms restrict collecting information by automated means without express permission, regardless of login status. A third-party paid actor does **not** automatically grant permission for a particular use. Before operating at scale or publicly, verify Meta/Instagram terms, the provider's terms, authorization basis, applicable privacy/copyright law and any data retention restrictions. Favor official Meta APIs when they meet requirements and credentials are authorized. Do not bypass login, CAPTCHA, blocks, private access, or rate limits. Store only needed public post metadata and user-authored research notes; link to originals, no default third-party media downloading or republishing.

This is project-planning guidance, not legal advice.

## Privacy and storage

Personal local app: IndexedDB stores public creator metadata, Reel metrics, source links, scan history and user notes on the device. Include **Clear data**, JSON backup, delete favorites, and a retention setting (default e.g., keep last 20 scan snapshots or 90 days). Warn that clearing browser data removes local history. An exported report can include third-party usernames and captions: keep export user-initiated and avoid sharing private commentary.

## Production check

- [ ] Provider credentials provisioned as serverless secrets; absent from repo and browser bundle.
- [ ] All paid endpoints owner-authenticated, CSRF/origin protections appropriate for auth mode, input-capped and rate-limited.
- [ ] Allowlist provider origin and Actor ID; no SSRF/arbitrary proxy.
- [ ] Compliant data access reviewed and documented, no bypass behavior.
- [ ] Exact source IDs and observation times included; no false fresh badges.
- [ ] Error/partial/cost cap/failure cases tested.
- [ ] Local WebStorm and hosted production use supported origins, no insecure wildcard CORS.
