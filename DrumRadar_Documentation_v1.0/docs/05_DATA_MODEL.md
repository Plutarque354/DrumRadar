# 05 — Domain Model, Provenance and Time Zones

## Record identity / types

Use stable immutable identifiers; keep every measurement's observation time and source. Suggested JavaScript shape (illustrative schema, not scraped account data):

```js
Creator = {
  id: 'handle:slrnoise', handle: 'slrnoise', profileUrl: 'https://www.instagram.com/slrnoise/',
  displayName: null, category: 'drummer', enabled: true, priority: 1,
  creatorTimeZone: null, // IANA ID (e.g. 'America/Toronto'), user-set only
  note: '', sourceId: null
}
ProfileObservation = {
  creatorId: 'handle:slrnoise', followers: null, observedAtUtc: null,
  providerRunId: null, status: 'NOT_FETCHED'
}
Reel = {
  id: 'shortcode:<actual-shortcode>', shortcode: '<actual-shortcode>',
  creatorId: 'handle:slrnoise', url: 'https://www.instagram.com/reel/<actual-shortcode>/',
  caption: '', hashtags: [], publishedAtUtc: null, thumbnailUrl: null,
  music: null, sourceType: 'watchlist' // or 'reference' / 'hashtag-search'
}
ReelObservation = {
  reelId: 'shortcode:<actual-shortcode>', observedAtUtc: null,
  playCount: null, viewCount: null, likes: null, comments: null,
  followersAtObservation: null, provider: 'apify-deepmine', providerRunId: null,
  dataQuality: { completeEngagement: false, viewMetricType: null }
}
Scan = {
  id: '<uuid>', source: 'apify-deepmine', startedAtUtc: '<ISO UTC>',
  finishedAtUtc: null, windowHours: 72, selectedCreatorIds: [],
  perAccountLimit: 20, status: 'NOT_STARTED', runTickets: [],
  errorMessages: [], coverage: {}, isDemo: false
}
Favorite = { reelId: '...', title: '', note: '', tags: [], savedAtUtc: '<ISO UTC>' }
```

## IndexedDB stores

`creators` keyed by id; `scans` keyed by scan ID with statuses and run tickets; `reels` keyed by media ID/shortcode; `observations` indexed by reelId and observedAt; `profiles` indexed by creatorId and observedAt; `favorites` keyed by Reel ID; `settings` (single owner preferences). Version DB and provide upgrade logic. Index scanId/creatorId/publishedAtUtc for fast filters. Provide JSON backup/restore with schema version. Do **not** persist API token, owner passphrase, session credentials, or unnecessary private data.

## Normalization invariants

- `null` / unavailable / hidden value is **not** `0`.
- Counts must be finite, non-negative integers. Reject negative, Infinity, NaN, malformed numeric strings.
- `followersAtObservation` is observed close to current scan time, not necessarily what the creator had when the video was published. Label it correctly.
- Use Reel media ID or shortcode to dedupe duplicated results from account, direct URL or search. Keep provenance/source routes and tags.
- Only active watchlist Reels published inside the selected rolling window go into Top 10; direct reference or hashtag-expanded posts can be inspected separately unless user explicitly selects inclusion mode.
- Retain `playCount` and `viewCount` as separate columns; choose one consistent source metric per ranking run and **label it**. Never silently combine uncomparable counters. Prefer `videoPlayCount` as default 'Plays' if uniformly present; otherwise explicitly separate result groups or use `videoViewCount` with declared mode.
- Store sources with observation timestamp, run ID, returned item ID and normalization version; show number of exclusions due to insufficient fields.
- Sanitize external URLs and text; render captions/text as text nodes, not raw HTML.

## Time-zone logic

`publishedAtUtc` must be a parseable absolute ISO 8601 time. Convert with `Intl.DateTimeFormat({ timeZone: ianaId })`; do not add fixed UTC offsets, since DST changes. `viewerTimeZone` from `Intl.DateTimeFormat().resolvedOptions().timeZone`. A creator's time zone is unknown until the owner assigns an IANA zone. Never infer from name, language or apparent country. Include ISO UTC in exports.

**Exact rolling interval:** At scan initialization set `anchor = scanStartedAtUtc`. Include a Reel only if `anchor - windowHours*3_600_000 <= Date.parse(publishedAtUtc) <= anchor`. Use same anchor for all creators. An older pinned Reel must not enter results. If timestamp is missing, put Reel into an **Unverified date** list outside time-window leaderboards.

**Snapshot distinction:** If data collected Nov 13 measures lifetime Reel plays as of Nov 13, it is not 'plays in last 72 hours'. The 72h condition refers to **time of publishing** only. Later 'velocity' requires at least two observations of the **same Reel**, different collection timestamps and comparable counters.

## Hashtag extraction

Take documented `hashtags` array where available and also extract from **full** caption as a fallback/union, retaining non-ASCII letters/numbers and `_` using Unicode-aware JS regex (test with accented and non-Latin hashtags); normalize Unicode NFC and case-fold to lowercase, remove leading `#`, dedupe within each Reel, reject empty/broken strings, and preserve an original display form. Avoid matching @mentions, embedded URLs, or ordinary words as hashtags. Test caption hashtag + array dedupe.

## Completeness and diagnostic fields

Per Scan: requested accounts; successful profiles; Reels returned; Reels eligible in window; missing followers; missing plays/views; missing likes/comments; skipped invalid timestamps; duplicate media; null/empty captions; number of distinct observed hashtags; cost if known; provider rate limit/errors. This supports honest UI coverage messages such as `14/23 eligible Reels had enough information for engagement ranking`.
