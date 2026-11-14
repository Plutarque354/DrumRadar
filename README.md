# DrumRadar v1.0 — First Testable Application

A buildless, personal Instagram Reel research workspace. **Live-data acceptance is blocked until an authenticated Apify pilot succeeds.** No paid provider run was executed during this build. Demo data is synthetic and uses fictional handles, separate from your real seeded watchlist.

## Start in WebStorm (no API credentials needed)

1. Extract `DrumRadar_v1_Testable.zip` and open the enclosed `DrumRadar` directory in WebStorm.
2. Install Node.js 22 or newer if using the included server or tests.
3. In WebStorm's terminal, run `npm start`. No `npm install` is needed for the static frontend or unit tests.
4. Open **http://localhost:8788**. Alternatively, right-click `public/index.html` → **Open in Browser**, using WebStorm's HTTP preview. Do not use `file://`.
5. Choose **Explore Demo**. This creates 24 synthetic Reels and a complete 34-tag inventory. Explore the three rankings, switch Plays/Views, open a Reel, and save a filming idea. Reload to check local persistence.
6. The real watchlist is seeded with `slrnoise`, `brycewestondrums`, and `lukehollandd`; follower counts remain unavailable until collected. Creator timezones start unknown.

All seven sections are implemented: Overview, Reels Explorer, Hashtag Intelligence, Creators, Saved Ideas, Scan History, Settings. Search fields apply when committed (Tab/blur). Hashtag CSV export always exports the **entire selected-window inventory**, not just filtered or paginated rows. Reel CSV exports all collected rows, including references with source labels.

## Configure Cloudflare and Apify

The frontend never receives your Apify token. The gateway uses a separate owner bearer token entered at runtime and kept only in JavaScript memory. Re-enter it after reloading. Do not paste credentials into chat or commit them.

From the extracted project directory:

```sh
npm ci
npx wrangler login
npx wrangler secret put APIFY_TOKEN
npx wrangler secret put OWNER_ACCESS_TOKEN
npm run deploy
```

- `APIFY_TOKEN`: your private Apify API token with permission to run the actor and read its runs/datasets.
- `OWNER_ACCESS_TOKEN`: generate a unique random value of at least 32 characters, for example using your password manager. It is **not** the Apify token.
- Wrangler 4.162.0 is pinned as a deployment-only development dependency. It is not a frontend framework or application runtime dependency.
- `wrangler.toml` deploys static assets and the JavaScript Worker together, plus one SQLite-backed Durable Object for paid-request coordination. A Cloudflare account supporting Workers/Durable Objects is required. Review your Cloudflare plan charges.
- Choose a unique `name` in `wrangler.toml` if needed. The initial migration belongs to this new Worker; do not reuse it indiscriminately in another existing project.
- The static UI is publicly servable, but stores data only in your browser. All API endpoints require the owner token. You can additionally protect the deployment using Cloudflare Access; the owner-token check remains required in this version.

In **Settings**:

1. Enter the deployed gateway origin, e.g. `https://drumradar.YOUR-SUBDOMAIN.workers.dev` (replace with the URL actually returned by Wrangler).
2. Enter your **OWNER_ACCESS_TOKEN**, then **Save settings**.
3. Click **Check gateway**. This verifies authentication and secret presence, **not Instagram collection**.

For local gateway development, copy `.dev.vars.example` to `.dev.vars`, replace both placeholders privately, then run `npm run gateway`. Wrangler normally serves http://localhost:8787; use its actual printed origin. Never upload `.dev.vars`. `npm start` only serves frontend files; it does not provide the API.

The configured local origins are `http://localhost:8788`, `http://localhost:63342`, and `http://127.0.0.1:63342`. Add the exact origin used by your WebStorm browser if different. No wildcard CORS is allowed. Only HTTP loopback origins or HTTPS are accepted for browser gateway settings.

## First real scan

1. Confirm you have appropriate permission for the intended automated access. A third-party actor being available does not itself establish that permission. This app does not bypass access controls or collect private profiles.
2. Review the actor and its current pricing in Apify Console: https://apify.com/deepmine/instagram-scraper
3. In **Run Scan**, select the three seeded accounts, **72 hours**, **5–10 Reels/account**, and a **$0.15 total provider charge cap** to begin. Verify the account count preview.
4. Check the authorization/spending checkbox, then **Confirm & start live scan**. This creates separate Reel and profile jobs. The scan cap is divided across jobs; it is not applied independently in full to each job.
5. Follow **Scan History**. A terminal job can return partial or empty data. Open **Details** for confirmed provider run IDs, coverage, reported costs and failures.
6. Compare at least two returned Reels against Instagram and record evidence in `PILOT_REPORT.md` before considering the live MVP verified.
7. In Reels Explorer, use **Inspect reference Reel** to test `https://www.instagram.com/reel/DTsrSE2Dm9R/` separately. Reference rows never enter the watchlist leaderboards. For the direct Reel's follower denominator, include its creator in a watchlist scan; the app never launches an unapproved extra profile lookup automatically.

The gateway fixes the actor to `deepmine~instagram-scraper`, limits requests to 50 accounts, 50 Reels/account, 1,000 watchlist Reels total, a 1–168-hour window, **$0.50 maximum per scan**, and **$2/day of reserved scan caps in UTC**. Reservations are intentionally not refunded automatically when jobs fail or cost less. Actor caps exclude unrelated subscription/platform charges; verify the pilot invoice. Partial data can result when caps are reached.

## Recovery and duplicate protection

The browser saves a UUID and scan options before the first POST. The Durable Object persists that same intent and budget reservation before contacting Apify. Reusing the key returns the recorded scan instead of creating paid jobs. Only one owner scan can be active. Polling and data retrieval never start new jobs.

- After an interruption, enter your owner token and choose **Scan History → Resume saved scan**.
- If a provider POST times out, its outcome is unknown: it may have started a billable run. The app records `START_UNKNOWN`, never retries that POST, and keeps the owner lock.
- In that case, inspect Apify Console and stop any still-running jobs. Open scan **Details** and use the explicitly labeled lock-release action only after reconciliation. Releasing a lock does not abort a provider job.
- If you lose all browser data, use the authenticated gateway recovery route described in `docs/API.md`; your original request metadata remains server-side. Do not clear local storage to try to cancel a provider run.
- If collection succeeds but retrieving items fails, Resume refetches the same jobs, without paying for new collection.

## Interpretation and persistence

- Publication is filtered inclusively against the scan's fixed UTC start minus the selected hours, not relative to the time the dashboard is reopened. Old pinned posts are excluded by actual timestamps.
- Selecting a wider display window cannot recover posts not retrieved by the scan.
- Plays and views are independent nullable metrics. Missing values are `—`; true zero remains zero. No fallback mixing is performed.
- Ratios use the latest profile observation **within the selected scan**. Cached snapshots retain their original denominators. These are observed follower counts, not historical counts at publication.
- The reported observation time uses provider job completion where available (an upper bound on per-row capture), otherwise retrieval time. The actor does not advertise exact per-row metric capture timestamps. Both publication and provenance are kept; never interpret totals as engagement earned only inside the publication window.
- Hashtag tiers follow the supplied methodology: ≥3 eligible engagement observations, ≥2 creators, median per-Reel ratios, tied competition ranking, S/A/B/C/D percentile boundaries. Insufficient tags remain Provisional.
- IndexedDB preserves creators, scan snapshots, Reels, observations, profiles, hashtags, ideas and preferences. Use the same browser **and origin** to access the same database. Private browsing/site-data deletion can erase it.
- Backups export JSON; import/restore and automated retention are deferred. UI data deletion does not delete the server-side coordination registry or stop Apify runs.

## Tests

```sh
npm test
npx wrangler deploy --dry-run
```

Open http://localhost:8788/browser-tests.html for an isolated, click-to-run browser harness covering Demo, saved-note reload persistence, navigation and page containment at 1440/768/390px. It uses `drumradar-test-v1`, not your main database. Run in a clean test database for repeatable seed assertions. It makes no paid calls.

See `TEST_REPORT.md` for actual executed results, and `PILOT_REPORT.md` for the blocked live pilot. This build's browser test run was blocked by the available browser environment's inability to reach the local server; **browser checks are supplied but not claimed as passed**.

## Source layout

```text
public/              Buildless HTML, CSS and browser ESM
  js/                UI, storage, normalization, analytics, time, exports, API
worker/              Authenticated Worker, Durable Object, provider adapter
scripts/serve.mjs    Small static development server (Node built-ins only)
tests/               node:test unit / mocked gateway integration suite
fixtures/            Explicit synthetic provider fixtures
docs/                API contract, research notes, recorded test output
wrangler.toml        Static hosting + Worker + Durable Object binding
```

No GitHub writes were performed. Review the ZIP locally, then copy it into your repository or push manually using your preferred workflow. Do not commit `.dev.vars`, `.env`, `.idea`, `.wrangler`, or `node_modules`.
