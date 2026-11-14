# 07 — Minimal Private Gateway API Contract

## Scope

A compact Cloudflare Worker in plain JavaScript acts as an authenticated, input-validated bridge between the static frontend and Apify. These routes are the product's **internal gateway interface**, not Apify endpoints. Field names can be refined, but equivalent behavior and security are mandatory.

## Authentication and authorization

Preferred: protect UI and API with **Cloudflare Access**, only the owner allowed; verify authenticated identity or use Cloudflare's protected route policy. Minimal alternate: configure a strong `OWNER_ACCESS_TOKEN` Cloudflare Worker secret and require it in a header submitted at runtime (never embedded in static JS or persisted). Authenticate before any billable route or results retrieval. Rate-limit requests and restrict CORS to the deployed site and explicitly configured WebStorm origin. Do not send provider token to browser.

## Routes

### `GET /api/health`

Returns service status, provider adapter configured/unconfigured, app version, no secret values, e.g. `{ "ok": true, "provider": "apify-deepmine", "configured": true }`. This should not be used to expose account identity or API keys.

### `POST /api/scans`

Validated request body (example only):

```json
{
  "creatorHandles": ["slrnoise", "brycewestondrums", "lukehollandd"],
  "windowHours": 72,
  "perAccountLimit": 20,
  "maxChargeUsdPerRun": 0.50,
  "inspectionReelUrl": null
}
```

Server validates: usernames by strict Instagram-handle pattern and length; unique handles; account limit; lookback range 1..168h; Reels/account range 1..50 by default; total result count cap; allowed URL only `https://www.instagram.com/reel/<shortcode>/` or `/p/<shortcode>/` for optional inspect; no arbitrary provider URL or actorId; enforce server-side charge ceiling. Reject costly/potentially abusive inputs with 400/422. Require deliberate owner authentication; optionally HTTP 409 if an active run is already known.

Worker starts **two asynchronous Apify jobs** (`reels`, `details`) and returns a scan ID, scan anchor, source, linked run IDs / signed run tickets, and initial statuses. If one job fails to start, preserve the other and return `PARTIAL_START` rather than losing its run ID. Never report `SUCCEEDED` before provider terminal success.

Illustrative response:

```json
{
  "scanId": "<random-id>",
  "startedAtUtc": "<current ISO UTC>",
  "provider": "apify-deepmine",
  "state": "STARTED",
  "runs": [
    {"mode": "reels", "runId": "<provider-run-id>", "ticket": "<signed-short-lived-ticket>", "state": "RUNNING"},
    {"mode": "details", "runId": "<provider-run-id>", "ticket": "<signed-short-lived-ticket>", "state": "RUNNING"}
  ]
}
```

Never trust client-supplied run IDs without owner authorization and a signed ticket or server-side registry. Keep run IDs retrievable after browser refresh (IndexedDB) but never treat knowing an ID as sufficient provider authorization.

### `GET /api/runs/:runId/status`

Require owner auth plus the correct signed run ticket/server-side registry membership. Proxy status, `startedAtUtc`, `finishedAtUtc`, `defaultDatasetId` only if necessary, source run identity, user-friendly errors, actual costs when provider supplies them. Poll at a sane cadence (e.g., 3–5 seconds initially, with backoff to 15 seconds). Stop on success/failure/abort/timeout and report which sub-run failed.

### `GET /api/runs/:runId/items?offset=0&limit=100`

Require owner auth/ticket, bound `runId` and dataset ID, `limit` 1..200, valid `offset`, bounded total pages. Read completed run's dataset from Apify; return JSON only, strip provider secrets and unnecessary sensitive metadata; may return normalized records or safe provider subset with `mode`, `provider`, `observedAtUtc`, `nextOffset`, `hasMore`. Validate page counts, avoid proxying arbitrary datasets/URLs, and handle JSON parse/provider failures without duplicating ingestion.

### Optional `POST /api/runs/:runId/abort`

Only if Apify provides documented abort endpoint and user deliberately requests it. Note costs already incurred may still be charged; cancelling a browser request does not stop a running provider job. If not implemented, omit control rather than an inert button.

## Request lifecycle

1. Owner confirms paid scan in frontend.
2. Client saves pending request state immediately and sends POST to gateway.
3. Gateway authenticates, validates, starts two actor runs, returns IDs/tickets.
4. Client persists run tickets and polls statuses through gateway.
5. When each run terminal-success, client paginates data through gateway and normalizes with testable adapter.
6. Client merges profiles/reels, exact UTC window-filters, dedupes, computes metrics, writes immutable snapshot and updates dashboard.
7. Errors/partial coverage displayed with safe retry action; never auto-start a new billable run on transient polling error.

## Provider run details

Apify documented endpoints:

- POST `https://api.apify.com/v2/acts/deepmine~instagram-scraper/runs` (async)
- GET `https://api.apify.com/v2/actor-runs/{runId}`
- GET `https://api.apify.com/v2/datasets/{datasetId}/items?format=json&offset={n}&limit={n}`

Use header `Authorization: Bearer <APIFY_TOKEN>` only in Worker code. Apply price caps (`maxTotalChargeUsd`, and where applicable `maxItems`) per job; do not conflate caps for the two parallel jobs. If necessary set a total user-visible per-scan maximum equal to sum of all job maxima, plus clearly labeled possible extras.

## Errors and http semantics

- `400/422`: input problem; account/URL/cap validation with specific reason.
- `401/403`: owner auth/access issue, no provider token disclosure.
- `409`: duplicate/in-progress scan where state available.
- `429`: local rate limit or upstream rate limit; back off, don't automatically pay twice.
- `502/503/504`: upstream/network/provider unavailable; retain previous snapshot with stale label, never replace it with fabricated live data.
- `200` with `state: PARTIAL`: some modes or accounts missing. Show detailed coverage.

## CORS and local dev

In production prefer same-origin UI/API, avoiding cross-origin entirely. For WebStorm preview, optionally use development gateway configured for only `http://localhost:63342` and an explicit allowed loopback origin, never `*` for authenticated routes. `file://` is not a supported live test origin. Include OPTIONS preflight with minimal allowlisted methods/headers. Apply `Cache-Control: no-store` for authenticated provider proxy responses.
