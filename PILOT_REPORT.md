# DrumRadar live pilot report

**Status: NOT EXECUTED — missing provider credentials and configured owner gateway.**

Prepared November 13, 2026 (America/Toronto; build logs use UTC November 14).

No Apify token or Cloudflare credentials were supplied, and no relevant credential variables were present. No authenticated actor run was started. No Instagram access restrictions were bypassed. A small live collection therefore could not be verified. The GitHub README read returned 404; repository contents were not relied on or modified.

| Input | Real run ID | Actual cost | Metric coverage | Outcome |
|---|---|---|---|---|
| slrnoise | None | Not incurred by this build | Unverified | Blocked |
| brycewestondrums | None | Not incurred by this build | Unverified | Blocked |
| lukehollandd | None | Not incurred by this build | Unverified | Blocked |
| /reel/DTsrSE2Dm9R/ | None | Not incurred by this build | Unverified | Blocked |

## Public documentation review (not live validation)

The actor listing and public OpenAPI were reviewed. The candidate exposes `resultsType` modes `reels` and `details`, profile usernames/direct URLs, per-input `resultsLimit`, total `maxResults`, and an optional newer-than filter. The implementation uses separate follower-detail and Reel jobs plus an optional independent direct-Reel job. Provider date filtering is coarse; the app applies exact UTC boundaries itself.

The actor advertises Reel permalinks/owner, publication timestamps, plays/views, likes/comments, captions and hashtags; profile rows advertise followers. Its README's rendered output-field section was partially malformed, and its dedicated output-schema URL was inaccessible in the lookup tool. The implementation therefore maps the documented field names from the supplied specification and actor descriptions conservatively. **Actual output field coverage and current schema compatibility remain unverified.** Unexpected/missing metrics remain null.

Advertised prices on the reviewed listing: $1.15 / 1,000 results (Free), $0.99 (Starter), $0.85 (Scale), $0.69 (Business), plus $0.30 / 1,000 profile-detail events. These are vendor claims, not a measured invoice or guaranteed future price. The listing displayed 15 total users, 8 monthly users, no ratings, and a recent update. Reliability cannot be concluded from these figures or the vendor's sample rows.

No Instagram-wide hashtag feed, saves/shares, private access, or historical follower denominator is promised. Tag intelligence is computed from the retrieved watchlist sample.

## Cost and API research

The Apify Run Actor API documents asynchronous starts and `maxTotalChargeUsd`; `maxItems` is a pay-per-result charging limit, not a universal guarantee of dataset length. The app additionally sets actor `maxResults`, bounds dataset retrieval and limits job counts. Each scan's budget is divided across its jobs, with a tiny downward rounding margin. The Worker also reserves a daily ceiling. A real pilot must verify billing behavior and partial results when the cap is reached.

## Pilot to complete locally

1. Follow README private credential setup; do not send tokens in chat.
2. Start 3 accounts × 5 Reels, 72 hours, $0.15 total cap; preserve Reel and profile run IDs separately.
3. Record returned columns and null rates: permalink, owner, timestamp, plays, views, likes, comments, caption/hashtags, followers. Check owner-to-profile matching.
4. Inspect the reference Reel in a separate capped run. Do not assume it is recent. Include its owner in a later approved profile run if a denominator is needed.
5. Compare two accessible original Reels. Note actor completion times and that per-row metric capture time may not be available.
6. Record actual run cost, duration, missing/private accounts, row caps, and retries (none should be automatic).
7. If coverage is poor, benchmark an authorized replacement behind the provider adapter. Do not claim successful live MVP acceptance until verified end to end.

Sources reviewed:
- https://apify.com/deepmine/instagram-scraper
- https://apify.com/deepmine/instagram-scraper/api/openapi
- https://docs.apify.com/api/v2/actors-runs-post
- https://docs.apify.com/api/v2/actor-run-get
- https://docs.apify.com/api/v2/dataset-items-get
