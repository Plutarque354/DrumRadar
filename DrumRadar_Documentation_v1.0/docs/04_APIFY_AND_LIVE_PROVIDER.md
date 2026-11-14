# 04 — Apify Live Data Integration and Pilot

**Candidate actor:** [`deepmine/instagram-scraper`](https://apify.com/deepmine/instagram-scraper)  
**Reviewed:** 2026-11-13. Vendor descriptions and costs are not a successful live pilot.

## Why this actor

The provider advertises no-login profile details, Reels and posts, Reel play counts, timestamps, likes, comments, captions, and hashtags. It explicitly uses **separate results modes** (`reels`, `details`, `posts`, `comments`). At inspection, listing showed zero ratings and only a small user base: treat reliability as unproven and test before committing. Profile followers are obtained using `details` rows; Reel rows include `ownerUsername` for matching.

**Critical limitation:** Its hashtag search is **not** a complete recent Instagram hashtag feed, and this actor does not provide Instagram-wide hashtag analytics. Our exhaustive hashtag output means **all tags actually seen in the scanned Reel sample**, not all Instagram posts carrying those tags. Also, its listing says shares and saves counts are not supported. Do not promise those values.

## Verified advertised input properties

| Mode | Example input keys | Output role |
|---|---|---|
| Reels | `resultsType: "reels"`, `usernames`, `resultsLimit`, `onlyPostsNewerThan`, `skipPinnedPosts` | Reel metrics and caption/hashtags; exact time filter still applied in app |
| Profile details | `resultsType: "details"`, `usernames` | Account follower counts, account type, observed metadata |
| Exact Reel | `resultsType: "reels"`, `directUrls: [instagram reel URL]`, `resultsLimit: 1` | Inspect supplied direct reference; keep separate from rolling-window results |

Other documented keys include `hashtags` (optional search seed), `maxResults` and `search`. Avoid adding optional hashtag exploration to the MVP unless it has distinct source labels and extra cost confirmation.

### Candidate request inputs (not executed)

```json
{
  "resultsType": "reels",
  "usernames": ["slrnoise", "brycewestondrums", "lukehollandd"],
  "resultsLimit": 20,
  "onlyPostsNewerThan": "4 days",
  "skipPinnedPosts": false,
  "maxResults": 60
}
```

```json
{
  "resultsType": "details",
  "usernames": ["slrnoise", "brycewestondrums", "lukehollandd"],
  "maxResults": 3
}
```

`onlyPostsNewerThan` is a **coarse optimization**, not the definition of a 48/72h scan. A 72h scan may request 4 days from the provider to allow for relative-date rounding; application MUST keep only `scanStartedAtUtc-72h <= publishedAtUtc <= scanStartedAtUtc`. Similarly 48h may request 3 days. Pinned content is not trusted for recency.

## Apify REST API protocol (no SDK necessary)

Use asynchronous Actor runs rather than long synchronous calls:

- `POST https://api.apify.com/v2/acts/deepmine~instagram-scraper/runs?maxTotalChargeUsd=<cap>&maxItems=<cap>` with JSON body and `Authorization: Bearer ...` **server-side only**.
- Response includes `data.id` (run ID), `data.defaultDatasetId` and status.
- `GET https://api.apify.com/v2/actor-runs/<runId>` with authentication for status; optionally `waitForFinish`, but ordinary periodic polling is simpler.
- When successful, `GET https://api.apify.com/v2/datasets/<defaultDatasetId>/items?format=json&offset=...&limit=...` through Worker, paginated.

Consult current [Apify Run Actor](https://docs.apify.com/api/v2/actors-runs-post), [Get Actor Run](https://docs.apify.com/api/v2/actor-run-get), and [Get Dataset Items](https://docs.apify.com/api/v2/dataset-items-get) documentation while coding. API run cost-cap support is documented, but verify actual actor pricing model and whether caps apply as expected.

## Output field mapping to verify with pilot

| Documented source field | Intended normalized field | Caveat |
|---|---|---|
| `id`, `shortCode`, `url` or permalink | `reelId`, `shortCode`, `url` | Validate URL; build from shortcode only when valid |
| `ownerUsername`, `ownerId` | `creatorHandle`, `creatorSourceId` | Match against profile rows; collaborators not automatically denominator |
| `caption`, `hashtags` | `caption`, `hashtags[]` | Parse full caption as fallback and deduplicate per Reel |
| `timestamp` | `publishedAtUtc` | ISO8601 UTC; reject invalid/missing timestamp for time ranking |
| `videoPlayCount` | `playCount` | **Plays**, not identical to unique viewers; preserve semantics |
| `videoViewCount` | `viewCount` | Alternative view counter; may be null and may differ from plays |
| `likesCount`, `commentsCount` | `likes`, `comments` | Nullable; hidden likes not zero |
| `displayUrl` | `thumbnailUrl` | Temporary URL may expire; graceful image fallback |
| `musicInfo` | `music` | Optional; no requirement to reproduce audio |
| profile `username`, `id`, `followersCount` | `creator.handle`, `creator.sourceId`, `followersAtObservation` | Track profile `observedAtUtc`; positive denominator required |

Only normalize fields actually present in returned rows. Third-party schemas may change. Store enough raw metadata for diagnostics **without** leaking secrets and avoid archiving unnecessary personal information.

## Mandatory first live pilot

Run the actor manually in Apify Console or through a configured Worker using a small cost cap; use the following inputs and **capture real run IDs**:

- Priority: `slrnoise`, `brycewestondrums`, `lukehollandd`.
- Reference: `https://www.instagram.com/reel/DTsrSE2Dm9R/` (test direct URL, regardless of age).
- Separate pilot Reels and Details jobs; start at 5–10 Reels per profile; scale to 20 only if coverage/metrics are satisfactory.
- For every source: record valid account flag, profile followers, number of returned Reels, publication timestamps, view/play semantics, like/comment completeness, hashtags, permalink and source run ID.
- Compare at least two known Reels in browser and provider output; note metrics will vary with collection time.
- Capture provider-reported cost and duration and any notes about private/unknown/limited accounts.
- Review use rights and relevant Instagram/Meta access terms; do not interpret vendor's availability as permission.

### Pilot outcome worksheet

| Source | Reels retrieved | Followers? | Views/plays? | Likes/comments? | Time? | Hashtags? | Actual run ID | Status |
|---|---:|---|---|---|---|---|---|---|
| slrnoise | Not tested | Unknown | Unknown | Unknown | Unknown | Unknown | — | Pending |
| brycewestondrums | Not tested | Unknown | Unknown | Unknown | Unknown | Unknown | — | Pending |
| lukehollandd | Not tested | Unknown | Unknown | Unknown | Unknown | Unknown | — | Pending |
| Example Reel | Not tested | N/A | Unknown | Unknown | Unknown | Unknown | — | Pending |

**Failure rule:** If 0 usable Reel posts, or no positive follower denominators, or large missing-data rates, do not fake success; mark pilot failed/partial, preserve working frontend, document blockers and compare a more-established actor (`apify/instagram-scraper`) or official access. Replace the provider behind an adapter, not a redesign.

## Pricing: vendor's advertised list, not a quote

At time checked, `deepmine/instagram-scraper` listing states (per 1,000 result rows) roughly **$1.15 Free, $0.99 Starter, $0.85 Scale, $0.69 Business**, with an extra **$0.30 per 1,000 profile detail events**. Example **hypothetical** 3 profiles + 60 Reels = 63 results; at Starter nominal row rates roughly `$0.063` excluding other plan/platform costs, subject to current actual charges, duplicate lookups, provider rules, and budget caps. Re-check dashboard pricing before each serious test. Never promise a fixed cost.

## Provider fallback and why

A zero-rating new actor may break, change response shapes, or prove incomplete. Adapter abstraction means swap provider with minimal UI impact. Compare data fields and actual reliability of `apify/instagram-scraper` (longer-established listing), official Meta Business Discovery when user meets authorization requirements, or another authorized API. **Do not** automatically route through unauthorized scraping or bypass blocks; request appropriate access or gracefully degrade.
