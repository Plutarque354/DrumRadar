# Decisions, Assumptions and Terminology

## Architecture decisions

- **D-001** Use HTML/CSS/vanilla JS in browser; no frontend build chain.
- **D-002** Cloudflare Worker in vanilla JS as secret-safe, authenticated provider bridge; no Python/FastAPI/Selenium for MVP.
- **D-003** Candidate live provider `deepmine/instagram-scraper` (Apify); acceptance conditional on real small pilot and permission review.
- **D-004** Distinguish Reel views vs plays, hidden vs 0 counts, publication time vs observation time, and account snapshot followers vs historical followers.
- **D-005** Return all observed sample hashtags; empirical tier gate and provisional evidence labels.
- **D-006** Default creator timezone is unknown until user assigns IANA timezone.
- **D-007** Rollout starts with a paid on-demand live vertical slice, not a static mock dashboard.
- **D-008** Personal one-user browser IndexedDB persistence; server state minimized and documented.
- **D-009** Do not assert global Instagram trends from a small monitored sample.

## Vocabulary

- **Creator**: a monitored Instagram profile.
- **Reel**: a single Instagram short video object; raw `type` / `productType` may vary, validate mapping.
- **Scan**: authenticated on-demand collection involving at least Reels and profile follower detail jobs.
- **Fresh**: newly initiated collection (source run recorded) with dated observations.
- **Recent**: Reel publication timestamp within selected exact rolling UTC interval.
- **Observed plays/views**: total reported at observation time, not increment within rolling interval.
- **Engagement/follower**: public (likes+comments) / observed followers; proxy, not internal Instagram engagement rate.
- **All hashtags**: all distinct tags observed in available and eligible sampled Reels; never Instagram-wide exhaustive collection.
- **Tier**: relative heuristic conditional on minimum sample sizes; not causal advice.
- **Provisional**: observed tag without evidence gate, not excluded.
- **Source link**: genuine Instagram permalink for exact Reel.
- **Unknown**: missing/null field, not numeric 0.

## Unresolved questions / assumptions for Work

- Are the selected accounts accessible and sufficiently covered by the actor? Unknown until live test.
- Are automated access permissions suitable for the intended use? Must be reviewed before live collection.
- Does the operator have Apify account/token/credits and Cloudflare deployment? Not established.
- What are actual fees and performance for 3 accounts? Unknown until pilot.
- Which count semantics are reliably returned for all three? Unknown; show plays and views separately and select explicit metric.
- Which creator time zones are correct? No automatic assumptions; user inputs when known.
