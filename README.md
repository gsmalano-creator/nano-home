# nano-api.com

Marketing site and docs for the [nano-api](https://nano-api.com) family of single-purpose APIs.
Astro, deployed to Cloudflare Workers.

Two live services, both in the `nano-api` repo:

- **NanoPulse** (`pulse.nano-api.com`) tells you when a job you depend on has stopped running.
- **NanoRelay** (`relay.nano-api.com`) calls your endpoint on a schedule and tells you when that
  fails.

Everything is free while the service is young, so there is no plan catalogue — see `/pricing/`.

## Pages

| Route | Content |
| --- | --- |
| `/` | The umbrella: what the two services are, what they share, and how they cover each other |
| `/pulse/` | NanoPulse: animated CSS demo of a heartbeat going flat, the crontab one-liner, uptime-vs-heartbeat |
| `/relay/` | NanoRelay: animated run log with a retry and an alert, the DST argument, failure behaviour |
| `/howto/` | Both services end to end in copy-paste curl |
| `/pricing/` | Free for now: what that includes, why, and what happens when it changes |
| `/about/` | Who runs it, how it is built, and what not to expect |

## Editing content

Everything commercial lives in `src/consts.ts`: the default quota, the feature list, the service
list (name, host, `live`/`planned` status, page link) and the contact channels. Flipping a service
to `live` there updates the cards and removes the "planned" notice on the how-to page. The pricing page and the front page both read from it, so the two can never
disagree. Change a price in one place.

`DEFAULT_QUOTA` mirrors `users.monitor_limit` in the API, which covers monitors and schedules
together. Raising a customer's limit is one admin API call and needs no change here.

## Development

```bash
npm install
npm run dev        # astro dev on :4321
npm run preview    # astro build + wrangler dev, i.e. the real Workers runtime
npm run check      # astro build && tsc && wrangler deploy --dry-run
npm run deploy
```

`.npmrc` pins the public npm registry: without it, a private company registry leaks into
`package-lock.json` and Cloudflare's build fails with `npm error code E401`.

## Design notes

- Dark, monospace-accented palette in `src/styles/global.css`. Tokens only — no framework.
- The hero graphic (`src/components/PulseDemo.astro`) is one 12-second CSS loop with no
  JavaScript, and collapses to a static end state under `prefers-reduced-motion`.
- `public/og.png` is generated from an SVG; regenerate it with `sharp` if the wording changes.
- Copy rule: the site may only claim what the API actually does. Email and SMS alerts, status
  pages and SLAs are not built, so they are either absent or explicitly marked as not built.
- No blog. Contact is `hello@nano-api.com` (forwarded with Cloudflare Email Routing) for keys and
  invoices, with X as the informal alternative.
