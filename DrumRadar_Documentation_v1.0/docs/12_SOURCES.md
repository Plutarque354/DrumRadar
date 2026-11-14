# 12 — Research Links and Verification Notes

**Checked 2026-11-13.** All provider pricing, schema, availability, policy, and popularity can change; verify again during Work before coding. These links document vendor claims, not proof that any seed handle was successfully scanned.

## Candidate actor and field contract

- DeepMine actor overview: https://apify.com/deepmine/instagram-scraper
- Actor input schema: https://apify.com/deepmine/instagram-scraper/input-schema
- Actor output schema: https://apify.com/deepmine/instagram-scraper/output-schema
- Actor API page: https://apify.com/deepmine/instagram-scraper/api
- Actor JavaScript API examples: https://apify.com/deepmine/instagram-scraper/api/javascript

The listing documents `resultsType` (`reels`/`details`), `usernames`, `directUrls`, `onlyPostsNewerThan`, `resultsLimit`, `maxResults`; `videoPlayCount`, `videoViewCount`, `likesCount`, `commentsCount`, `timestamp`, `hashtags`, `ownerUsername`, profile `followersCount`. It also explicitly limits hashtag coverage and does not advertise saves/shares counts. The actor showed **no published rating** and a small user base when reviewed; verify reliability independently.

## Apify REST API

- Run Actor asynchronously: https://docs.apify.com/api/v2/actors-runs-post
- Get Run status: https://docs.apify.com/api/v2/actor-run-get
- Read dataset items: https://docs.apify.com/api/v2/dataset-items-get
- Synchronous Actor call exists, but long runs may time out after 300s: https://docs.apify.com/api/v2/actor-run-sync-get-dataset-items-post

Prefer asynchronous run/poll/results endpoints for interactive use. API authentication belongs in Worker `Authorization` header and should never be pasted into URL query parameter or client code.

## JavaScript/Cloudflare

- Cloudflare Workers secrets: https://developers.cloudflare.com/workers/configuration/secrets/
- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- MDN IndexedDB overview: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- MDN Intl.DateTimeFormat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

## Alternatives

- More-established Apify Instagram actor: https://apify.com/apify/instagram-scraper
- Official Meta Instagram API docs (Business Discovery): https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery/
- Open-source inspiration (not dependencies): https://github.com/instaloader/instaloader and https://github.com/subzeroid/instagrapi

## Access/terms caveat

- Instagram terms: https://help.instagram.com/581066165581870 (verify current form and applicable jurisdiction).
- Meta terms language reported in a state regulator-hosted document: https://oag.ca.gov/sites/default/files/Meta%20California%20AB%20587%20Terms%20of%20Service%20Report%20-%20Q3_Q4%202024.pdf/Meta%20California%20AB%20587%20Terms%20of%20Service%20Report%20-%20Q3_Q4%202024.pdf

These terms restrict automated collection without express authorization. A vendor's ability to return public media does not automatically establish that your intended automation is authorized. Review lawful data sources and use rights before operation at scale.

## Evidence limitations

No authenticated Apify runs were executed for this documentation package. No real account follower counts, Reel view counts, rankings or hashtag popularity claims are included. Any numerical examples elsewhere are explicitly illustrative. Pilot results must be written from actual API responses during implementation.
