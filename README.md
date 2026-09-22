# nano-api.com

Marketing site and docs for the [nano-api](https://nano-api.com) family of single-purpose APIs.
Astro, deployed to Cloudflare Workers.

The first service is **NanoPulse** (`pulse.nano-api.com`) — a dead man's switch for cron jobs,
background workers and servers. Its code lives in a separate repo.

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero with an animated CSS demo of a heartbeat going flat, the crontab one-liner, uptime-vs-heartbeat comparison, the service family, pricing teaser |
| `/pricing/` | Plans (Free / Pro / Business / Custom), what every plan includes, and the questions a buyer actually asks |
| `/about/` | Who runs it, how it is built, and what not to expect |

## Editing content

Everything commercial lives in `src/consts.ts`: plan names, prices, quotas, shared features, the
service list and the contact channels (`CONTACT_EMAIL`, `X_URL`). The pricing page and the front page both read from it, so the two can never
disagree. Change a price in one place.

```ts
export const PLANS: Plan[] = [
  { id: "pro", name: "Pro", price: "$9", cadence: "per month", monitors: "50 monitors", ... },
];
```

Plans map directly onto the `users.monitor_limit` quota in NanoPulse — a plan *is* that number,
so "upgrading" a customer is one API call and needs no change here unless the price moves.

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
