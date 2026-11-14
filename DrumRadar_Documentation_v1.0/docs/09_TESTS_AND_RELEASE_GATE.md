# 09 — Test Matrix and Release Gate

## Test strategy

The project should include dependency-free browser-runnable tests or simple Node built-in test runner (`node:test`) for **pure** analytics functions (Node used only for tests, not an installed backend), plus manual browser checks and a small billed Apify pilot. A CI workflow may use Node for tests even though frontend runtime is vanilla JS and no npm installation is needed.

## Pure function tests — must pass

| ID | Scenario | Expected |
|---|---|---|
| T01 | 80,000 plays / 10,000 followers | exactly `8.0` multiplier |
| T02 | 1,100 likes + 120 comments / 10,000 followers | `12.2%` engagement/follower |
| T03 | followers 0, null, NaN, missing | ratio `null`; Reel stays in Explorer |
| T04 | likes null, comments 0 | engagement `null` (not 0%) |
| T05 | likes 0, comments 0, followers 1,000 | valid `0%` |
| T06 | plays 10k, views 8k | remain separate fields and rankings specify chosen metric |
| T07 | Reel posted just inside UTC 48h boundary | included |
| T08 | Reel 1 millisecond outside 48h | excluded |
| T09 | 4-month-old pinned Reel in returned feed | excluded from 72h leaderboards |
| T10 | ISO time missing/invalid | unverified-date list, not recent leaderboards |
| T11 | creator IANA timezone `America/Toronto`, DST boundary | correct local offset and date; UTC preserved |
| T12 | creator timezone unknown | visible unknown label, no auto inference |
| T13 | `#Drums #drums #drum_cover` + array `drums` | only two normalized distinct tags for Reel |
| T14 | Unicode hashtags, punctuation, multi-line captions | Unicode preserved; nonhashtags excluded |
| T15 | 100 tags including 70 provisional | all 100 searchable/exported with accurate counts |
| T16 | tag in 1 Reel, 1 creator | visible `Provisional` and linked Reel |
| T17 | exactly 3 eligible Reels and 2 creators | tag qualifies, tier computed deterministic |
| T18 | 2 identical Reel shortcodes from separate collection modes | one Reel, duplicate provenance preserved |
| T19 | 4th-party reference Reel outside timeframe | inspectable but not present in Top 10 |
| T20 | 8 eligible Reels | leaderboard shows 8, not fake 10 |
| T21 | stable tie ranking | consistent across reload/export |
| T22 | caption with `=HYPERLINK(...)` | safe text render and CSV formula escaping |

## Gateway contract tests / security

- Unauthorized `POST /api/scans` returns 401/403; cannot bill.
- Handle that looks like URL/JS/script injection rejected; arbitrary host in inspection URL rejected.
- Account cap, result cap and maxChargeUsd hard enforced server-side; client numbers untrusted.
- Worker API never returns `APIFY_TOKEN`; frontend JS and browser inspector contain none.
- Invalid run ID/ticket cannot expose arbitrary datasets.
- No automatic duplicate paid run from repeated click/temporary network error. If cross-tab lock not implemented, limitation is documented and testable.
- Pagination fetches all pages, dedupes rows, handles partial pages and 429/5xx gracefully.
- Failed Details run leaves Reels visible but engagement ratios unavailable; failed Reels run leaves profiles status intact.
- Stale cached snapshot clearly labelled; no 'live' badge until real current run completed.

## UI manual acceptance

- Open `index.html` through WebStorm's built-in local server; no frontend build process.
- Layout functions at ~1440px, 768px and 390px viewport widths.
- Can add/remove/toggle seeded creators; settings persist after reload.
- Can select count/48h/72h/per-account limit; scan preview and user confirmation visible.
- Hashtag table lists **every** observed hashtag and exports all, not one page.
- Can click any top ranked Reel to original source and inspect source time in creator/user zone when configured.
- Keyboard Tab navigation, focus indicators, contrast, loading/error/empty states work.
- Save a Reel with a note; reload; note remains; JSON export succeeds.

## Live pilot evidence — mandatory

- An actual Apify run ID for **Reels** and **Details**, with authentic provider output, timestamp, cost (if available), and `deepmine` actor version or source identity.
- At least one valid accessible Reel permalink returned, plus real publication timestamp, caption/hashtags and at least one observable metric. To validate follower-normalized ranking, at least one creator needs positive live followers and a Reel with complete required fields.
- Test all three handles, but document unsupported/private/no-new-post outcomes accurately. The user-provided Reel should be tested separately as a source-reference fixture.
- Record a source data comparison for two Reel URLs if at least two accessible; any discrepancy explained as time variation or field difference.
- No fabricated reports in live dashboard. If no valid provider data, this is a functional prototype with **blocked live acceptance**, not a finished MVP.

## Explicit release gate

**PASS** only if: real on-demand live collection works from the authenticated owner-controlled interface; three Reel leaderboards compute correctly on eligible live rows; every observed hashtag can be found/exported; timestamp and time zone are correct; source IDs and freshness visible; costly operations bounded; local WebStorm startup documented; validation tests passing.

**CONDITIONAL** if fresh provider results work but some seed handles lack new Reels or metrics. Clearly show coverage and no promises about missing accounts.

**FAIL/BLOCKED** if the only functional dataset is synthetic, provider token embedded in frontend, scan endpoint public and unbounded, or calculations fake missing fields.

## Deliverable evidence in final build report

Report: paths of generated files, local launch steps, deployed gateway/required actions, test command/output, live run IDs and data counts if authorized, passing vs blocked acceptance items, cost/permission caveats, known limitations. Do not claim tests or live scans were run unless they really were.
