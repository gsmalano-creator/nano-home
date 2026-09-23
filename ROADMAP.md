# Roadmap

What is promised in public, what is parked, and why. `SERVICES` in `src/consts.ts` is the public
list — only put something there once you intend to be asked about it.

## Live

- **NanoPulse** — `pulse.nano-api.com`. Heartbeat monitoring. Shipped 2026-09-22.
- **NanoRelay** — `relay.nano-api.com`. Scheduled calls with retries and alerts. Shipped
  2026-09-23. Notes below kept because they explain the design decisions.

## What makes a good nano-api service

The strong ones all have the same shape: **a small piece of durable state plus a guarantee.** A
counter that never loses an increment. A lock that is actually exclusive. A key that is seen
exactly once. That is what is tedious to do yourself — not the logic, but having to run a database
for three rows. The same goes for anything that needs a clock: "something must run every minute"
is what forces you to keep a machine alive, which is the whole reason Relay exists.

Pure functions are weak products by this measure. QR codes, markdown rendering, UUIDs: `npm
install` solves them in ten seconds, so nobody pays for an endpoint.

Checklist for a candidate:

1. Almost every project needs it.
2. Doing it yourself means running storage, a schedule, or both.
3. It fits in one endpoint with no SDK.
4. It is cheap on Workers + D1/KV/DO, so the free tier survives.
5. It does not make us a liability (no attacker-controlled fetch, no email sending, no auth).

## Candidates, in the order I would build them

- **NanoLock** — `flock` as a service. `POST /v1/locks/:name?ttl=60` returns 200 if you got it, 409
  if someone holds it. Solves "two instances ran the import at once", is surprisingly hard to get
  right yourself, and pairs directly with Relay and with any Kubernetes CronJob that can overlap.
  The guarantee *is* the product.
- **NanoCount** — increment and read named counters. Download counts, likes, feature usage.
  Built-in distribution: serve an SVG badge and every README showing the number is an advert.
- **Form endpoint** — somewhere a static site can POST its HTML form, stored and forwarded. Probably
  the most universally needed thing on this list: every landing page, every "contact us", every
  waitlist. Formspree and Tally live off it; the cheap end is open.
- **Idempotency keys** — "have I seen this before?" `POST /v1/seen/:key` answers atomically with a
  TTL. Every webhook consumer needs it and builds it with a table and a unique index.
- **Kill switch / config flags** — a tiny JSON per key, read at the edge. Everyone reinvents this
  badly with an environment variable that needs a redeploy.
- **Email validation** — syntax, MX lookup, disposable-domain list. The DoH code already exists in
  Relay's URL guard, and the incumbents charge absurd money for it.
- **Business-day calendar** — is 2 January a banking day in Norway? Static data, updated once a
  year, needed constantly by payroll and invoicing.
- **Caller geo** — Cloudflare hands us country, city and ASN free on every request via `request.cf`.

## Deliberately not

- **Sending email.** Deliverability is a full-time profession: SPF, DKIM, IP warming, blocklists.
  One spamming customer ruins the reputation for everyone.
- **Auth, OTP, magic links.** The liability is enormous and the bugs are breaches.
- **Generic KV or Redis.** Upstash owns it, and it is not "one thing".
- **URL shortener.** Crowded, and an abuse magnet — you become phishing infrastructure by week two.
- **Anything else that fetches a customer-controlled URL.** Relay already carries that risk once,
  with an SSRF guard and a DoH check. Do not multiply it by three.

## Shipped: NanoRelay

The mirror image of Pulse: we call the customer's endpoint on a schedule, with retries, timeouts
and alerting on failure. Pulse watches jobs the customer runs; Relay runs the jobs they would
rather not host.

Why this one first: it sells to the customer we already have, in the same subscription, and reuses
roughly 70% of Pulse — users, API keys, quotas, `monitor_events`, webhook delivery, state
transitions. Value per customer goes up without more distribution work, which is the only growth
that is free for one person.

What it adds beyond "call my URL", which is what the free alternatives stop at:

- Alerting on the actual outcome (status code, timeout, duration) rather than inferred from silence.
- Timezone-correct cron. `0 3 * * *` in `Europe/Oslo` across DST is the real differentiator —
  platform crons are UTC-only, so their jobs silently shift an hour twice a year.
- Run history, overlap protection ("don't start if the previous run is still going"), and jitter.

Build notes:

- v1 needs no Durable Objects. A `schedules` table indexed on `next_run_at` plus the existing
  per-minute cron sweep is the same shape as `runDueChecks` and holds for thousands of schedules.
  Move to DO alarms only when sub-minute precision or volume demands it.
- Parse five-field cron expressions locally (~100 lines). Get timezone conversion from
  `Intl.DateTimeFormat` with `timeZone` — no timezone database dependency in Workers.
- Write the DST tests first; that is where the bugs live.
- At-least-once: a timed-out call may have landed. Document that endpoints must be idempotent and
  send an `X-NanoRelay-Run-Id` so customers can deduplicate.
- Relay must ping Pulse on every run, because when a scheduler fails the symptom is silence — the
  exact problem Pulse exists to solve.

Open product decision: whether schedules share `users.monitor_limit` with monitors ("50 monitors or
schedules", one number to explain) or get their own `schedule_limit`. One number is the KISS answer.

Guardrail, non-negotiable before launch: the customer chooses the URL we call. Require https, block
private IP ranges **at resolution time** (DNS can point outward to `10.x`), cap concurrency per
destination domain, and consider domain verification for frequent schedules.

Effort: a weekend, plus an evening on cron and DST tests.

## On ice: stream manifest monitoring

Synthetic monitoring of HLS/DASH streams: poll the manifest, check the media sequence actually
advances, verify the bitrate ladder is complete and that the newest segment is real video, from
several geographies. It catches the failure class where everything returns HTTP 200 while the
broadcast is frozen.

Investigated 2026-09-23 against a real public DASH manifest. The technical case holds — the
manifest read fine while its segments returned `403 AccessDenied`, which is exactly the "green
dashboard, dead stream" shape the product sells against, and no ordinary uptime check would have
noticed.

Parked anyway, for one reason that survived the investigation: **a tier-1 broadcaster already has
this**. Client-side QoE telemetry (Conviva, NPAW, Mux Data) reports from real players on real
devices, vendor tooling watches the encoder and packager, the CDN has its own error dashboards,
and there is an on-call team. An earlier claim that "the customer cannot do this themselves" was
wrong at that size; they can run probes in three cloud regions in an afternoon.

The one real gap, even in a mature stack: client telemetry needs viewers. A channel nobody is
watching at 04:00 can be dead for hours with no data points at all, and the same is true for the
small channels in a large portfolio. That is a supplement argument, and supplements are hard to
sell.

So the addressable buyer is not the big broadcaster but the long tail — regional channels, sports
federations, municipalities streaming council meetings, and the white-label platforms serving
them. Smaller budgets than first assumed: a few hundred dollars a month, not a few thousand.

**Before spending another hour on it**, answer two questions that cost nothing: what do people in
the industry actually use today, and has it ever alerted them *before* a viewer complained? If the
answer to the second is no, the gap is real. Also: a monitor must carry the same entitlement the
player has, and that per-customer setup is the actual work — not the polling.

## Parked: NanoDefer (deliberately not on the site)

One-shot version of Relay: POST a payload and a timestamp, we deliver it to a webhook at that
moment. The valuable framing is a *cancellable per-item timer* — what people build today with a
`scheduled_jobs` table and a cron that scans it. Best use cases are the cancellable ones: "expire
this order in 30 minutes unless it is paid", escalate an unacknowledged incident, schedule a retry,
send at the user's local morning.

Durable Object alarms are the right primitive (precise to the second, survive restarts, retried by
the platform). Cloudflare Queues have a per-message delay but cap out around 12 hours, so anything
longer needs alarms regardless.

Why it is parked:

- Upstash QStash does exactly this, well and cheaply; AWS EventBridge Scheduler covers the same need
  for anyone already in AWS; Inngest and Trigger.dev take over the whole workflow above that. There
  is no obvious angle beyond "it is in the same subscription as Pulse".
- It is the most dangerous of the three to operate: an open HTTP relay where the attacker controls
  URL, timing *and* volume. Ten thousand deliveries to one victim in one second is a DDoS tool with
  our return address on it.

Worth building anyway for one reason: DO alarms are also what precise Pulse alerting would need if
five-minute cron granularity ever stops being good enough.
