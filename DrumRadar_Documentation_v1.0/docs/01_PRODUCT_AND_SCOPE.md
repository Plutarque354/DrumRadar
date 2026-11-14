# 01 — Product Requirements and Scope

## Product definition

A private, desktop-friendly creator-intelligence workspace used by a drummer to research publicly discoverable Instagram Reels. Build for drummers first; avoid hardcoding drum-only labels into the domain model so guitarists, bassists, producers and other musicians can use it later.

## Primary workflow

1. Open **Dashboard**, see last completed scan, time zone, freshness, and observed coverage.
2. Enter **Creators**, add Instagram usernames/URLs and assign categories/tags, priority and optional IANA time zone.
3. Open **Run Scan**, select all or checked accounts, choose account cap (10/25/50/custom), rolling window (48/72h/custom), per-account Reel limit, maximum billable items/charge, and confirm the paid operation.
4. Trigger collection, inspect separate **Reels** and **Profiles** run statuses; handle incomplete accounts and retry only deliberately.
5. See three leaderboards of **exact video posts**, not merely best creators, each linked to its original Instagram Reel.
6. Visit **Hashtag Intelligence** to see **every observed hashtag**, rank/tier, qualifying Reel sample, per-tag videos, confidence/coverage, export.
7. Filter/sort full **Reels Explorer**, inspect caption/audio where available, publication UTC/creator/user times, and save Reel + user-created note.
8. Save/export a snapshot; optionally return for another manual scan and compare observed metrics across runs.

## P0: required for first testable version

- F01: Functional live-source connection, using credential stored only in serverless secret. If credentials/permissions unavailable, explicit setup state — no fabricated live success.
- F02: Three seeded accounts and the one reference Reel available for direct inspection, with separately marked reference/out-of-window content.
- F03: Editable watchlist add/remove/disable/priority/timezone; persistence across reloads.
- F04: Select subset and max N accounts (default 3 while piloting; 10/25/50/custom controls), lookback 48/72h, per-account results cap, scan trigger, cost limit.
- F05: New Apify run(s) start on demand; display QUEUED/RUNNING/SUCCEEDED/FAILED/TIMED-OUT/ABORTED or equivalent statuses, last scan time, per-input problems, coverage summary.
- F06: Correct Reel publication-window filtering from exact ISO UTC timestamp; old pinned media excluded.
- F07: Video-level Top 10 by (1) absolute provider plays or views, (2) provider plays/views per observed follower, (3) (likes+comments) per observed follower (%). Do not treat missing as zero.
- F08: Searchable **complete** hashtags table with counts, distinct creators, median eligible Reel performance, tier/provisional, drilldown to each Reel, CSV export.
- F09: Reel Explorer with Reel thumbnails where safely accessible, links, view/like/comment/follower data, observable engagement ratio, caption, tags, source/time.
- F10: Display post UTC and viewer local time; creator time only if valid manually assigned IANA zone. Otherwise visibly 'Creator time zone unknown'.
- F11: Save favorites/research notes in IndexedDB and export JSON/CSV.
- F12: Clear stale/error/cached/demo labels, accessible keyboard-friendly responsive visual design consistent with original approved dashboard idea.
- F13: Reproducible project: README, configuration steps, tests, no packaged secrets, no frontend build or heavy JS framework.

## P1: next release, explicitly not P0

- Historical velocity across regularly spaced observation snapshots; growing/declining hashtag trends with actual time comparison; cross-window comparators.
- Separate creator benchmarking page with profile baselines, advanced filters, saved recurring scan presets.
- Analysis of audio/music metadata, length, day-of-week/time-of-day trends after adequate data collection.
- Multi-user accounts, paid hosted database, automated scheduled scans and notifications.

## Non-goals and honest limitations

- Not a universal Instagram trending index. Rankings are based on **the retrieved set of monitored accounts and videos**.
- No promise of every Reel on an account: provider pagination and visibility may omit items, even when a scan succeeds.
- No assumption that a creator's time zone is embedded in Instagram post data; an IANA zone can be manually supplied.
- No guarantees of reach, engagement causation, original 'upload local time', or recommendation algorithm reverse engineering.
- No downloading/reposting others' copyrighted video content by default; link to original Reel.
- No bypassing rate limits, authentication, access controls, or anti-bot blocks.

## User stories and testable expected outcomes

| As the owner, I want… | Done when… |
|---|---|
| to know the best video today | exact Reel permalink + metric + observation timestamp are visible |
| to spot small creators outperforming | views-per-follower and engagement-per-follower work with valid denominators |
| to explore **every** found tag | all distinct extracted tags are searchable/exportable, including provisional/no-data tags |
| to know whether data are current | scan start/completion time, source and fresh/cached/failed labels are always shown |
| to avoid wasted Apify credit | preflight shows caps, start requires explicit click, server enforces hard upper bounds |
| to compare publishing times fairly | UTC plus viewer local plus user-assigned creator IANA timezone are displayed correctly |
| to keep content ideas | notes and links survive reload and can be exported |

## Definition of 'testable'

The UI can be opened locally with WebStorm's built-in static server (not merely by double-clicking `file://`). A deployed secure Worker gateway connects to Apify when configured; a new scan can be launched and verified by its real Apify run ID; outcomes can be checked against live provider rows. Pure demo mode alone fails the MVP acceptance gate.
