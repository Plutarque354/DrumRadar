# Private gateway API

Every `/api/*` route requires `Authorization: Bearer <OWNER_ACCESS_TOKEN>`, except CORS OPTIONS. All responses use no-store. Origins must be same-origin or explicitly allowlisted. Provider secrets never go in URL parameters or responses.

| Route | Behavior |
|---|---|
| GET /api/health | Auth check and provider-secret presence only |
| POST /api/scans | Validate and reserve bounded paid scan; Idempotency-Key header required |
| GET /api/scans/:uuid | Refresh statuses for only registered runs |
| GET /api/scans/:uuid/items?mode=reels&offset=0 | Bounded sanitized dataset page; modes reels/details/reference |
| POST /api/scans/:uuid/release | Explicitly release active lock after operator reconciliation |
| GET /api/active | Recover active scan metadata and original validated input; no new paid request |

POST body:
```json
{"handles":["slrnoise","brycewestondrums","lukehollandd"],"hours":72,"perAccount":10,"budget":0.15,"reference":null}
```

UUID keys are persisted indefinitely to prevent old request replays. Conflicting input for an existing key returns 409. JSON options not listed above are rejected. Daily caps are reservations and reset by UTC date, while unresolved active locks persist until reconciled.

The returned scan owns its run IDs and dataset IDs in durable server-side storage; clients cannot choose arbitrary actors, provider URLs, runs or datasets. Dataset pages contain only allowlisted fields, are limited to 100 rows and the job's total row cap. Exact timestamps, zero/null handling, deduplication, follower joins and final window filters are handled by shared browser domain modules.

Recovery: use Settings → Recover active scan after re-entering the owner token. This fetches `/api/active`, stores its key/options locally, and opens Scan History. Then Resume. This is safe because the existing key is reused. Lock release requires body `{"confirm":"I checked and stopped any running jobs in Apify"}`. It does not stop a provider job or erase its cost reservation.

Statuses: STARTING/RUNNING then SUCCEEDED/PARTIAL/FAILED. Provider job states remain visible, including START_UNKNOWN, NOT_STARTED, ABORTED and TIMED-OUT. A failed or interrupted job's partial dataset may still be retrieved; it is never labeled complete. 401 authentication, 403 origin, 404 unknown registration, 409 conflict, 422 invalid input, 429 daily budget, 502/503 upstream/gateway failure. No raw upstream errors, stack traces or secrets are returned.

Provider adapter boundary: `worker/provider.js` owns the fixed actor, input construction, HTTP transport and safe field allowlist. `public/js/normalize.js` owns the documented field mapping. Changing actors requires modifying these modules and rerunning a small authorized pilot; the client cannot select arbitrary paid actors.
