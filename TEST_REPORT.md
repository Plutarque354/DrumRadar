# DrumRadar test report

Build date: November 13, 2026, America/Toronto (UTC test log date November 14).

## Executed

| Check | Result | Evidence / limit |
|---|---|---|
| `npm test` on Node 24.22.1 | **28 passed, 0 failed** | `docs/node-test-output.txt` |
| JavaScript syntax checks | Passed | `node --check` on application and Worker modules |
| `npx wrangler deploy --dry-run` | Passed | Wrangler 4.162.0; Worker bundled and assets/bindings resolved; `docs/worker-dry-run.txt` |
| Static HTTP server | Passed | Automated start/fetch test: HTML, ESM MIME type, missing-file 404 |
| Paid live Apify collection | **Blocked / not executed** | No credentials; no actual run IDs or charges |
| Cloudflare deployment / actual Durable Object runtime | **Not executed** | Dry run is not a deployment or real-runtime concurrency test |
| Browser rendering and IndexedDB persistence | **Blocked / not executed** | Available browser could not connect to the local HTTP server; native desktop attempt also encountered an accessibility-provider error |

The initial test run had 24 passes and 1 failure: summing three equal floating-point job caps exceeded the requested cap by floating-point rounding. The allocator now rounds down with a one-microdollar margin before division. The rerun passed; the expanded final suite passed all 28 cases. A first test command was also issued from the parent directory and returned package.json ENOENT; it was rerun from the project root.

## Automated coverage

- Separate play/view calculations, reach multiplier, engagement percentage.
- Null/hidden/invalid counts versus true zero; positive denominator requirement.
- Inclusive 48h/72h UTC boundaries, future posts, old pinned content, reference exclusion.
- IANA daylight-saving transition, invalid/missing timezone behavior.
- Unicode hashtags, NFC normalization, case folding, duplicate union and URL exclusion.
- Exact Instagram permalink validation, owner handle normalization, conservative row mapping.
- Case-insensitive follower matching, source-ID fallback, latest observation selection.
- Reel deduplication, latest metrics, provenance, stable ties and unranked missing denominators.
- Median-based tag evidence gate, tied competition ranks, all five tiers.
- Complete 2,000-hashtag CSV export and formula injection quoting.
- Owner authentication, origin allowlist, input/row/window/budget caps, fixed actor.
- Header-only provider auth, safe upstream failures, no automatic billable retries.
- Sanitized response allowlist; no arbitrary datasets through unknown scan IDs.
- Mocked Durable Object persistence/restart, concurrent duplicate request replay, active lock.
- Ambiguous paid POST preservation and partial scans.
- Daily reservation ceiling, recovery and conflicting idempotency-key rejection.

Gateway tests use mocked Apify responses and in-memory durable-storage doubles. They test application behavior, not Apify or Cloudflare service reliability.

## Browser tests included but NOT run here

Open `/browser-tests.html` on the local static server and click **Run browser tests**. The harness uses a separate database and tests:
- Seed watchlist and app initialization.
- Synthetic Demo rankings and complete 34-tag inventory.
- Saving notes and reloading IndexedDB-backed state.
- Page containment at 1440px, 768px and 390px iframe widths.
- Rendering all seven navigation sections.

These checks must not be represented as passed until you run them. The page remains available for visual inspection; layout assertions alone do not validate design quality or accessibility.

## Manual acceptance checklist

- [ ] Open in WebStorm/Node static server with no frontend installation; inspect empty state.
- [ ] Run the browser harness; inspect desktop/tablet/mobile spacing and horizontally scrolling tables.
- [ ] Navigate by keyboard; open/close dialogs with Escape; verify focus visibility and readable contrast.
- [ ] Add/edit/disable/remove a creator, assign America/Toronto, reload and verify persistence.
- [ ] Compare UTC/browser/creator time in Reel details; unknown timezone remains unknown.
- [ ] Search tags and Reels (commit field using Tab); sort and page; export all tags while a filter is active.
- [ ] Open CSV in a spreadsheet and verify quotes, Unicode, full row count and formula safety.
- [ ] Save/edit/delete a filming idea; reload; export full JSON backup.
- [ ] Configure gateway, save owner token, check health, reload and verify token must be re-entered.
- [ ] Run the authorized live pilot from PILOT_REPORT.md; verify actual run IDs, cost and metric coverage.
- [ ] Double-click paid start / retry the same key; confirm only original actor runs exist.
- [ ] Reload mid-scan and resume; test interrupted provider start and lock reconciliation.
- [ ] Confirm missing/hidden metrics remain unranked; zero is displayed as zero.
- [ ] Inspect old reference Reel and confirm it is excluded from recent watchlist rankings.
- [ ] Test zero-result and partial scans; cached useful data must remain accessible.

## Known limitations and deviations

- Live provider coverage, billing caps and production gateway operation are unverified release gates.
- Browser responsiveness, accessibility and IndexedDB behavior require the supplied local browser tests/manual checks.
- Durable Objects add a small managed coordination component beyond a purely stateless Worker, to prevent duplicate paid requests across tabs/restarts.
- Exact metric capture timestamps per Reel are not provided by the verified contract; observation uses job completion (upper bound) or retrieval time. This is documented rather than invented.
- Direct-only inspection does not automatically purchase a profile lookup for an unknown owner. Add the owner to a watchlist scan when a follower denominator is needed.
- JSON restore, automatic retention/pruning, thumbnail/media previews, trend/velocity analysis and automated schedules are deferred. Exports, manual local clearing, source links and caption details are implemented.
- Static frontend assets can be publicly hosted; owner authentication protects API access. Use Cloudflare Access additionally if the entire website must be private.
- Source captions/notes are escaped before HTML insertion; provider permalinks are allowlisted. No video download/repost feature is included.

**Release verdict: runnable source for local testing, with an implemented but unverified live integration. Not a verified live-data MVP.**
