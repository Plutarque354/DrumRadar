# 02 — UI / UX Functional Blueprint

## Visual direction

Modern, polished, approachable, restrained analytics product. Near-white/light surfaces with subtle teal accent, clear typographic hierarchy, compact but readable charts, soft borders, spacious dashboard cards, dark-mode-ready CSS variables. Do not copy Instagram's UI. Desktop-first with responsive 768px and 420px layouts, semantic HTML, keyboard navigation, accessible focus rings, clear empty/error states. Prefer CSS over UI toolkits. Use inline SVG/icon library via CDN only if lightweight and necessary.

## Navigation

Top-level sections: **Overview**, **Reels**, **Hashtags**, **Creators**, **Saved Ideas**, **Scan History**, **Settings**. A persistent primary action **Run Scan** opens a scan drawer/modal. Mobile collapses side navigation into a menu.

## Dashboard / Overview

Top header: title, selected window, data-source pill (`Live · Apify`, `Cached`, or `Demo`), `Last collected [absolute datetime]`, refresh action, settings.

KPI strip: monitored accounts, accounts successfully scanned, total Reels retrieved, window-eligible Reels, unique observed hashtags, Reel metrics completeness, last scan cost if reported. Counts should refer to selected snapshot, not Instagram totals.

Below: three distinct Top 10 **Reel cards/table tabs**:

1. Most plays/views (raw);
2. Highest views-to-followers multiplier;
3. Highest observable engagement-to-followers percentage.

Each row: rank, Reel preview, creator handle, video link, publication date, metrics, follower count, window age, availability flags, metric observation time, possibly associated tags. Clicking a row opens an in-app detail drawer; explicit action opens original Reel.

## Reels Explorer

Search by creator/hashtag/caption, filters for window, minimum reliable metric, account, tags, creator size band, available/unavailable data; sort by publish date, raw views/plays, view multiplier, engagement ratio. Default sort most recent. List or grid display. Direct-reference Reel inspect tool isolated from window-only leaderboards. Detail drawer: original permalink, poster handle, caption (truncate/expand), hashtags, metric data and denominators, UTC/viewer/creator time, tags, saved-note action, source run/fetched timestamp. Show unavailable metrics as em dash + tooltip.

## Hashtag Intelligence: complete inventory

Main full table, not 5 chips; paginated with virtual scrolling if necessary. **Every distinct hashtag in the current selected retrieved sample** must appear. Columns: rank, tag, tier or Provisional, Reel count, distinct creator count, % sampled Reels, median view multiplier, median engagement/follower %, sample size / eligible count, last observed, trend if history exists. Default sort: empirical performance with stable deterministic tie-break; alternate frequency / alphabetical / creator diversity. Provide search, tier filter, creator filter, selected time window, explicit column tooltips, export **all rows** including hidden/paginated rows. Clicking a tag lists **all matching Reels** in sample. Never show a handful of 'top tags' as the entire inventory.

Top overview may show a few tags but the dedicated full table must remain exhaustive. An unknown or unrankable hashtag must not vanish.

## Creators / watchlist

Rows: handle, profile URL, display name if known, last observed followers, creator category (drummer/band/producer), user notes, manually configured IANA zone (or Unknown), priority, included in scan checkbox, last scan status. Add by handle or URL, deduplicate case-insensitively, allow edit/delete, paste multiple one-per-line. Preset 3 seed handles; user may select 10/25/50/custom where watchlist size permits. Distinguish creator list order from engagement ranking.

## Run Scan control panel

- Account selection: all/checked, count cap (10,25,50,custom), selected total preview.
- Lookback: segmented 48h/72h/custom integer hours (range e.g. 1..168).
- Reels per account: 10/20/50/custom; defaults 20 and server caps to a safe maximum.
- Optional exact Reel URL for inspection; separate from fresh-window leaderboards.
- Preflight estimate of **max charge** and maximum rows; no false guarantee of final invoice.
- Confirm source/provider and cost, then **Start live scan**.
- Status panel shows separate `Profile details` and `Reels` job states, job IDs (copy), elapsed time, progress indicators **only** if provider gives real measurable progress (otherwise indeterminate), error messages, timestamps, cancellation if supported.
- Disable duplicate-trigger requests while a scan is starting/running; recover stored run tickets after reload.
- On completion show count summary: requested accounts, successful, unsupported/failed, retrieved Reels, in-window Reels, unavailable fields, cost.

## Saved Ideas

Save Reel link + personal title, freeform note, tags (`groove`, `filming`, `editing`, etc.), date saved. Never imply rights to download/reuse media. Editable in IndexedDB; export and restore JSON.

## Time display

Example field group (illustrative formatting; not sourced live):

- `Published (UTC): 2026-11-12 21:00 UTC`
- `Your time: 2026-11-12 16:00 EST` (via browser Intl timezone)
- `Creator time: 2026-11-12 13:00 America/Los_Angeles` (only if creator configured; dates/offsets derived by Intl)

Use explicit IANA zone labels. Show daylight-saving conversions using browser Intl automatically. If creator zone unknown: `Creator time zone: not configured`. No automatic guess based on usernames or country.

## States / components

Handle initial setup, loading, scanning, no Reels posted within window, profile unavailable, unknown followers, hidden likes, source error, partial scan, budget cap, rate-limit, stale stored snapshot, authenticated gateway unavailable. Never mask failures with a mock report. Demonstration UI, if included, is behind **explicit Demo mode**, with watermarked or unmistakable labels.

## Interaction acceptance

- Search/filter/export include complete dataset, not just visible page.
- Tab and keyboard focus work; buttons have accessible labels.
- Badges are status indicators, not substitutes for prose.
- URL validation prevents javascript: and malformed links; external links use safe attributes.
- Tables remain usable for 1, 20, 200, or 2,000 observed hashtags.
