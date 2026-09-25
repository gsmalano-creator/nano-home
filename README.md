# nano-api.com

Marketing site and docs for the [nano-api](https://nano-api.com) family of single-purpose APIs.
Astro, deployed to Cloudflare Workers.

The live services, all in the `nano-api` repo:

- **NanoPulse** (`pulse.nano-api.com`) tells you when a job you depend on has stopped running.
- **NanoRelay** (`relay.nano-api.com`) calls your endpoint on a schedule and tells you when that
  fails.
- **NanoLock** (`lock.nano-api.com`) stops two copies of a job running at once.
- **NanoConfig** (`configmaps.nano-api.com`) holds a small JSON document you can change without a
  deploy.
- **NanoCount** (`count.nano-api.com`) counts things and renders an SVG badge.

Everything is free, so there is no pricing page — `/about/` says why, and lists the technical
limits. `/pricing` redirects there, because the URL has been linked.

## Pages

| Route | Content |
| --- | --- |
| `/` | The umbrella: what the services are, what they share, and how they cover each other |
| `/pulse/` | NanoPulse: animated CSS demo of a heartbeat going flat, the crontab one-liner, uptime-vs-heartbeat |
| `/relay/` | NanoRelay: animated run log with a retry and an alert, the DST argument, failure behaviour |
| `/lock/` | NanoLock: three lanes where only one is lit, the shell-script pattern, what the lease does and does not guarantee |
| `/config/` | NanoConfig: a document changing under a poll log, ETag/If-Match/rollback |
| `/count/` | NanoCount: a badge ticking up, the atomic-increment and no-key-badge arguments |
| `/howto/` | Every service end to end in copy-paste curl |
| `/about/` | Why it exists, why it is free, the limits, and what not to expect |

The read-only dashboard is not a page here: it is served by the API worker at
`dash.nano-api.com` so its fetches are same-origin. `DASH_URL` in `src/consts.ts` is the
only reference to it. Linking it from here rather than hosting it here is deliberate — see
the nano-pulse README.

## Editing content

Shared copy lives in `src/consts.ts`: the default quota, the service list (name, emoji, host,
`live`/`planned` status, summary, page link) and the contact channels. Flipping a service to
`live` there updates the cards and removes the "planned" notice on the how-to page. Every page
reads the same list, so the services can never disagree between pages. The copy never states how
many there are — the list grows, and a hardcoded count goes stale in nine places at once.

The voice is first person and matter-of-fact: these are tools the author kept rewriting, offered
as-is and free. No urgency, no "we", no feature-selling — if a page starts sounding like a
brochure, it has drifted.

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
