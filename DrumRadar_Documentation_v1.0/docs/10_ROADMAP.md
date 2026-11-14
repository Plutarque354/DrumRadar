# 10 — Build Milestones and Backlog

## Milestone 0 — Provider and access feasibility (must begin here)

- Review current actor input/output/pricing and Instagram permissions; confirm user Apify token/access is needed.
- Prepare two minimal `reels` + `details` requests for 3 named handles and small bounded live runs.
- Test direct Reel reference separately; write real output-mapping fixtures with sensitive fields removed.
- Note data field coverage, cost/run, actor reliability, failures, and whether access is permitted. If blocked, leave explicit instructions; don't assert successful live data.

**Exit:** integration approach verified or documented as blocked, adapter contract ready.

## Milestone 1 — Live vertical slice

- Implement minimal Worker auth/secret/mapped provider API endpoints and explicit CORS mode.
- Implement browser UI: seed watchlist, Run Scan, per-mode status, first real Reel list and account followers, provenance badge.
- Persist run tokens safely (noncredential signed tickets) and scan metadata in IndexedDB. Handle refresh, abort/failed run states.

**Exit:** owner can launch and inspect a real run (when authorized), without exposing provider token; or interface shows honest setup blocker.

## Milestone 2 — Analytics and full UI

- Implement normalized model, correct time filter/dedupe/missing-field handling.
- Add three independently sorted Reel Top 10 boards.
- Add exhaustive hashtag inventory, tier/provisional algorithm, Reel drilldown and CSV export.
- Add creator timezones, searchable Reels Explorer, Saved Ideas and responsive visual polish.

**Exit:** end-to-end interactive use, zero fake live metrics, all baseline tests pass.

## Milestone 3 — Reliability and release

- Test 48h and 72h edge cases, 3/10/25 account controls with cost limits; large sample pagination; empty/partial/failed outcomes.
- Security review: owner auth, token privacy, validation, provider allowlist, spend bounds.
- WebStorm setup, Cloudflare setup, origin/secret instructions, README, reference fixtures, screenshots from actual app if possible.
- Prepare GitHub repository with `.gitignore`; no embedded credentials. Final release report with live evidence or blockers.

**Exit:** explicit MVP release gate PASS/CONDITIONAL/BLOCKED with evidence.

## Backlog after the first testable build

**P1:** historical snapshot comparisons and Reel metric deltas, nonoverlapping-window tag momentum, creator baseline normalization, presets and scheduled scans with opt-in cost caps.

**P2:** supported sound/music insights, account discovery recommendations, AI-assisted qualitative Reel categorization (only with permission and labeled inference), multi-platform TikTok/YouTube modules, shared multi-user dashboard.

## Suggested commit sequence

1. `docs: add final specification, schema and acceptance tests`
2. `feat: add static dashboard shell and watchlist persistence`
3. `feat: add secure Apify worker adapter and scan status workflow`
4. `feat: normalize Reels and profile observations`
5. `feat: implement three Reel rankings and exhaustive hashtags`
6. `test: cover timezone, null metrics, pagination, tier gates`
7. `docs: add run setup, privacy/cost limitations and pilot evidence`

## Dependencies and risks

- A working paid/live data source depends on user-owned provider account and token; no token is embedded in docs.
- The new community-maintained actor may be unreliable; the adapter must support swapping it out.
- Permissions matter. Research is not authorization to automate collection.
- Browser-only storage means results local to browser and can be lost; backup export must be supported.
- Better analytics depend on richer samples; avoid overstating conclusions from three accounts.
