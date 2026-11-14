# DrumRadar — Final Product and Implementation Specification

**Version:** 1.0 (implementation handoff)  
**Date:** 2026-11-13  
**Status:** Requirements finalized for first testable build. Code and live-data integrations have **not** yet been implemented or verified.  
**Owner workflow:** WebStorm → GitHub → Cloudflare deployment → Apify pilot → real Instagram Reel research.

## Product mission

DrumRadar is a private, musician-first content research utility. Given a configurable watchlist of Instagram drummers, find **real Reels published in the last 48 or 72 hours**, rank the **individual videos** by views, views/followers and observable engagement/followers, extract **every hashtag in the retrieved sample**, and display exact publication times in UTC, the user's time zone, and a manually configured creator time zone. Save interesting videos as content ideas.

**Fresh data is the release-blocking feature.** A polished interface using demo figures is a prototype, not an accepted MVP. No invented account analytics should appear as real results.

## Final decisions

| Area | Decision |
|---|---|
| Frontend | Plain HTML, modern CSS, browser-native JavaScript ES modules. Optional small CDN imports; no React/Vue or frontend build step. |
| Server side | Thin JavaScript-only Cloudflare Worker/Pages Function as an authenticated, secret-safe data gateway. No Python, FastAPI, Selenium, browser automation, or always-on server for the MVP. |
| First live-data candidate | Apify actor [`deepmine/instagram-scraper`](https://apify.com/deepmine/instagram-scraper), subject to cost, reliability, and access-rights checks. |
| Alternate providers | Official Meta API where authorized and sufficient; benchmark Apify's more-established `apify/instagram-scraper` or other compliant option if the candidate fails. |
| Local persistence | IndexedDB for watchlist, normalized data, scan runs, favorites and creator IANA timezone settings; exports to JSON/CSV. |
| Leaderboards | Distinct Top 10 individual Reels: raw plays/views, plays/views ÷ followers, and (likes + comments) ÷ followers × 100. Mark view-count semantics clearly. |
| Hashtags | All distinct observed hashtags, not a curated shortlist; full table, filters, tiers, coverage counts, linked Reels, CSV export. |
| Scan | Operator-selected accounts/count, 48h/72h/custom period, per-account Reel cap, optional known Reel URL, manual start, progress, spend guardrails. |
| Integrity | Null means unknown; never replace missing values with zero. No live success claim without authenticated real provider result. |
| Compliance | Confirm permitted data access and respect Instagram/Meta policies; provider availability does not equal permission. |

## Seed inputs (unverified live coverage)

1. [@slrnoise](https://www.instagram.com/slrnoise/) — priority.
2. [@brycewestondrums](https://www.instagram.com/brycewestondrums/) — priority.
3. [@lukehollandd](https://www.instagram.com/lukehollandd/) — larger-creator comparison.
4. [Example Reel](https://www.instagram.com/reel/DTsrSE2Dm9R/) — direct URL inspection fixture, NOT assumed to fall within the latest 48–72-hour window.

## Package index

- [01 — Product vision, scope and user stories](docs/01_PRODUCT_AND_SCOPE.md)
- [02 — Interface and interaction specification](docs/02_UI_UX.md)
- [03 — Architecture and local/static development](docs/03_ARCHITECTURE.md)
- [04 — Live Apify integration and provider pilot](docs/04_APIFY_AND_LIVE_PROVIDER.md)
- [05 — Data schema, normalization and time zones](docs/05_DATA_MODEL.md)
- [06 — Rankings, tiering and hashtag methodology](docs/06_ANALYTICS.md)
- [07 — API and scanning protocol](docs/07_API_CONTRACT.md)
- [08 — Security, budget, reliability and policy](docs/08_SECURITY_AND_COST.md)
- [09 — Tests and launch acceptance criteria](docs/09_TESTS_AND_RELEASE_GATE.md)
- [10 — Implementation milestones and backlog](docs/10_ROADMAP.md)
- [11 — Local setup, secrets, deployment](docs/11_SETUP_DEPLOY.md)
- [12 — Technical research and references](docs/12_SOURCES.md)
- [Work build prompt — paste into Work/Astra](WORK_BUILD_PROMPT.md)
- [Example watchlist CSV](examples/watchlist.csv)
- [Example provider request inputs](examples/apify_inputs.example.json)
- [Glossary and release decisions](DECISIONS.md)

## Live-data definition

**Real** means actual provider output identified by run ID and retrieval time, with authentic Reel permalinks. **Fresh** means a new on-demand run is started when Scan is clicked (unless the user explicitly selects a cached report), with provider observation time displayed. **Recent** means the Reel's *publication timestamp* is within the selected exact UTC rolling window; it does **not** mean its views or likes accumulated only during that window. A scan can be fresh even when no accounts posted any new Reels, but the UI must say so and never invent results.

## Build handoff

Open a new chat in **Work**, attach this zip, and paste `WORK_BUILD_PROMPT.md` verbatim. The prompt tells Work to investigate the actual actor input/output first, implement the smallest runnable live-data vertical slice, then flesh out the dashboard and tests. A real Apify token is not included and must never be put into source control.
