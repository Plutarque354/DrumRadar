# 06 — Reels Rankings and Complete Hashtag Intelligence

## A. Three Reel leaderboards (all are video-level)

The ranked unit is a single Reel, **not** a creator. Each entry links to its exact Instagram source URL and shows which creator published it.

| Board | Computation | Inclusion requirement | Display |
|---|---|---|---|
| `Most viewed / played Reels` | raw `selectedVisualCount` | valid numeric count + in-window timestamp | `1,245,667 plays` or `views` — never vague |
| `Highest relative reach` | `selectedVisualCount / followersAtObservation` | positive observed followers, valid count, valid timestamp | `8.4× plays / follower` |
| `Highest observable engagement / follower` | `100 * (likes + comments) / followersAtObservation` | likes **and** comments available, followers > 0, in-window timestamp | `18.6%` |

**View metric choice:** Instagram/actor distinguishes `videoPlayCount` and `videoViewCount`. Never silently add or merge. Default selected metric **plays** if present consistently for relevant Reels, label board `Most played`, otherwise use `views` explicitly or show rows with missing play counts as `Unavailable`; an optional selector can switch if source data allow. Require source/metric label in export.

**Missing-data policy:** Missing likes? engagement is `null`, not comments-only. Missing comments? engagement is `null`, not likes-only. Missing follower count / zero denominator? ratios are `null`, shown in an `Unranked: missing followers` section. Do not discard the Reel from the explorer. Hidden metrics must never be coerced to zero.

**Sorting:** Highest metric first. Stable deterministic ties: (a) newer published timestamp, (b) shortcode/URL ascending. Exclude out-of-window Reels, even if pinned. Allow fewer than 10 entries when data insufficient; show explicit coverage such as `7 eligible of 23 Reels`.

**Important measurement interpretation:** The denominator is the follower count measured at scan time, not at Reel posting time; the interaction numerator is the public cumulative count at observation time. This ratio is an **observable cross-sectional proxy**, not actual unique reach or official Instagram engagement rate.

## B. Full hashtag inventory

Extract **all** distinct hashtags observed among **all in-window sampled Reels** (union of Reel `hashtags[]` and caption parser). Repeated occurrence within one caption counts once for that Reel. A tag present in one Reel must remain visible even if unrankable. Full table + paging + global search + CSV must include entire distinct set, not only top recommendations.

For each tag `t` compute:

- `reelCount(t)` — distinct in-window sampled Reel IDs containing t;
- `creatorCount(t)` — distinct creator IDs using t;
- `sampleCoverage(t)` = `reelCount(t) / total in-window sampled Reels` (not global hashtag volume);
- `engagementSampleCount(t)` — number of tagged Reels with complete `(likes, comments, followers)`;
- `playSampleCount(t)` — number of tagged Reels with complete `(plays, followers)`;
- `medianEngagementPerFollower(t)` — median of **per-Reel** engagement ratio of eligible rows, NOT ratio of sums;
- `medianPlaysPerFollower(t)` — median of per-Reel reach multipliers of eligible rows;
- `lastSeenPublishedAt(t)` — newest Reel publication timestamp, not detection time;
- `linkedReelIds(t)` — **all** relevant in-window sample Reel IDs, click to view;
- optional `creatorDiversity`, displayed as distinct creators/count.

Always show `null` and `N/A` for metrics unavailable; preserve the tag.

## C. Transparent, reproducible tier algorithm

An empirical tier is NOT a guarantee that adding the tag causes high engagement. **Do not imply causal advantage.** Tiers are a research heuristic and only compare the monitored sample.

**Default evidence gate:** `engagementSampleCount >= 3` **AND** `creatorCount >= 2` qualifies a hashtag for engagement-performance tier assignment. Otherwise label **Provisional**, retain the row, show `n=<count>` and exactly why (insufficient Reels/creators), and optionally sort by frequency. On the pilot sample this may mean that most tags are provisional, which is honest.

For eligible hashtags use `medianEngagementPerFollower` descending and stable alphabetical tie-breaking. Assign relative tiers from all eligible tags only, using percentile rank / rank-bucket boundaries:

- S: top 10% of eligible tags.
- A: next 20%.
- B: next 30%.
- C: next 25%.
- D: remaining 15%.

Define deterministic code behavior for tiny eligible populations (e.g., percentile rank = `(rank - 1) / max(1, N - 1)`, with S for value `<0.10`, A `<0.30`, B `<0.60`, C `<0.85`, D remainder). Equal scores share the same best rank (competition ranking), so a tier may be empty. Never force a tier to contain tags if not supported. Explain all boundaries and sample-size gate in an info tooltip.

**Other sort views:** frequency (reelCount desc), reach proxy (median plays/follower), number of distinct creators, alphabetical, last seen. A separate 'Frequent' highlight list must not be confused with the performance tiers.

**Option for future maturity:** Creator-relative uplift vs each creator's baseline Reel performance, to control for creator-specific audience patterns. Do not implement this without enough baseline observations.

## D. Trending vs popular

A one-time scan can show `Top-performing in the last 72h of publication` and `Common tags in this sample`. It cannot establish that a tag is **trending on Instagram**. A true *trending* label requires at least two comparable scans and a defined change statistic, e.g., tag share delta = `(tagReels/totalEligibleReels) in current snapshot − comparable previous snapshot`; publication-window samples must be nonoverlapping or compared with an appropriate method to avoid counting the same Reels twice. Add this as P1 unless reliable comparable historical snapshots are available. Never invent growth percentages.

## E. User-facing example of ratio behavior (synthetic)

Reel A: creator has 10,000 observed followers; 80,000 plays; 1,100 likes; 120 comments.

- Plays/follower = `80,000 / 10,000 = 8.0×`.
- Observable engagement/follower = `(1,100 + 120) / 10,000 × 100 = 12.2%`.

Reel B: creator has 1,000,000 observed followers; 800,000 plays; 20,000 likes; 200 comments.

- Plays/follower = `0.8×`.
- Observable engagement/follower = `2.02%`.

**No example figures are live data.**

## F. Export contract

Reels export: Reel URL, creator, timestamp UTC, observedAt UTC, followers, likes/comments, raw playCount/viewCount, selected visual metric, ratios, caption, hashtags, source/provider/run ID, completeness flags. Hashtags export: **every** tag (not current page only), tier/provisional, evidence gate fields, reelCount, creatorCount, median metrics, coverage, linked Reel URLs. Use CSV RFC-style quoting for commas, quotes, newlines and dangerous spreadsheet-leading characters (escape formula injection). JSON export keeps types and schema version.
