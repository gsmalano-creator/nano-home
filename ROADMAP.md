# Roadmap

What is promised in public, what is parked, and why. `SERVICES` in `src/consts.ts` is the public
list — only put something there once you intend to be asked about it.

## Live

- **NanoPulse** — `pulse.nano-api.com`. Heartbeat monitoring. Shipped 2026-09-22.
- **NanoRelay** — `relay.nano-api.com`. Scheduled calls with retries and alerts. Shipped
  2026-09-23. Notes below kept because they explain the design decisions.
- **NanoLock** — `lock.nano-api.com`. Leased mutual exclusion with a fencing counter. Shipped
  2026-09-23.
- **NanoConfig** — `configmaps.nano-api.com`. Versioned JSON documents. Shipped 2026-09-23.
- **NanoCount** — `count.nano-api.com`. Atomic counters with an SVG badge. Shipped 2026-09-24.
  `?monotonic=true` makes one a sequence allocator; see below.
- **Read-only API keys** — `scope` on `api_keys`, enforced by one check in `requireApiKey`.
  Shipped 2026-09-25.
- **NanoUniq** — `uniq.nano-api.com`. "Have I seen this key before?", inside a window. The
  caller supplies the key; nothing is generated. Shipped 2026-09-25.
- **The dashboard** — `dash.nano-api.com`. Read-only, no login, requires a read-scoped key. Served
  from the API worker so its fetches are same-origin. Shipped 2026-09-25.

## What makes a good nano-api service

**A small unix-style operation that holds state, and that is tedious to reimplement in every
project.** Three clauses, and all three have to hold.

The rule is not aspirational; it describes what actually got built. Every service here is a unix
verb that needed somewhere to keep its state:

| Unix | Here |
| --- | --- |
| `flock` | NanoLock |
| `cron`, `at` | NanoRelay |
| a watchdog / process supervisor | NanoPulse |
| a dotfile you can edit from elsewhere | NanoConfig |
| `wc -l >> file`, atomically | NanoCount |
| `uniq` | NanoUniq |

The verb clause is the useful one, because it is *generative* rather than merely evaluative: walk
through the toolbox and ask what the stateful HTTP version of each tool would be. "A small piece
of durable state plus a guarantee" — the earlier phrasing — told you whether a candidate was any
good, but never where to look for one.

What is tedious is never the logic. It is having to run a database for three rows, or keep a
machine alive because something must happen every minute. That is the whole reason Relay exists.

### What the rule excludes

**Pure functions.** QR codes, markdown rendering, UUIDs. `npm install` solves them in ten seconds,
so nobody wants an endpoint.

**Pure lookups.** Email validation, holiday calendars, IP geolocation. These hold no state and are
not operations; they are datasets with an HTTP face. Useful, but a different business: the work is
sourcing and maintaining data, not making a guarantee. Three former candidates moved out on this
basis — see below.

**Anything where the guarantee is the easy part.** If the hard bit is evaluation, targeting or
workflow, the storage overlap is a mirage. See the LaunchDarkly section.

### Checklist for a candidate

1. Name the unix tool it is. If you cannot, be suspicious.
2. It holds state that has to survive a restart.
3. Almost every project needs it, and doing it yourself means running storage, a schedule, or both.
4. It fits in one endpoint with no SDK.
5. It is cheap on Workers + D1/KV/DO, at the volume it will actually be called.
6. It does not make us a liability (no attacker-controlled fetch, no email sending, no auth).

Point 5 is new and it has teeth. Every service so far is called once per job, cycle or deploy:
low volume, high value per call. A candidate called once per *request to the customer's app* has a
completely different cost and latency profile, and the shape of the rule will not warn you. See
rate limiting.

### On the word "enterprise"

"Kjipt å reimplementere i hvert enterprise-prosjekt" is the right demand signal — that is where
the same work gets redone most often. But it is the wrong *buyer*: enterprise procurement asks for
SSO, a DPA, an SLA and sometimes on-prem, which is the opposite of what one person can promise for
free. Use it privately to find candidates; keep it out of the public copy. The user is the
developer, whatever the company size.

### Precedent: ask whether a flag covers it first

"A sequence allocator" looked like a new service on 2026-09-25. It was not: `POST /v1/counters/:name`
already returns a distinct number to every concurrent caller, and `?by=100` already allocates a
block in one round trip. The only gap was that a plain counter may move backwards, which is right
for a tally and wrong for an invoice number. That became `?monotonic=true` — one column, one
`WHERE` — instead of a sixth subdomain.

Do this check before every entry below: is this an existing service plus a guarantee?

## Candidates, in the order I would build them

(NanoLock and NanoConfig came off this list on 2026-09-23, NanoCount on 2026-09-24, NanoUniq on
2026-09-25. All shipped.)

### 1. Form endpoint

Somewhere a static site can POST an HTML form; stored, listable, and optionally forwarded to a
webhook. Not a unix tool exactly — the closest is a mail drop — but it clears clauses two and
three by a mile, and it is probably the most universally needed thing that has ever been on this
list. Every landing page, every "contact us", every waitlist. Formspree and Tally live off it and
the cheap end is open.

Carries the abuse surface the others do not: it is an unauthenticated public write endpoint, so it
needs per-origin allowlisting, a size cap, and rate limiting before it can exist at all. Spam is
the product risk, not the engineering.

### 2. Rate limiting — the shape fits, the economics might not

Token bucket per key. The single most reimplemented stateful operation in enterprise code, always
written slightly wrong, needs a clock and somewhere to keep counters. The signup limiter in
`core/signup.ts` is already this, in D1.

And it is the first candidate where the selection rule is satisfied but the operating model is
not. Everything else here is called once per job. A rate limiter is called once per request to the
customer's app, which means:

- **Latency is on the critical path.** A D1 round trip from a Worker is fine once a minute and
  unacceptable in front of every request.
- **The volume is inverted.** Thousands of writes a minute per customer, each worth almost
  nothing. That is the exact failure I had to fix in nano-marketwatch's render counter, but as the
  product rather than a bug in a demo.

Durable Objects are the right primitive — single-threaded, in-memory state, no read-modify-write
race — and Cloudflare has a native rate-limiting binding that may be a better answer than
anything hand-built. **Before writing any of it:** measure a DO round trip from a Worker in the
same colo and decide whether the free tier survives a customer with real traffic. If the answer
is no, this belongs in "deliberately not", and that would be a useful thing to have established.

### Maybe: webhook fan-out — `tee`

Receive one call, deliver it to several destinations, with retries and per-destination alerting.
Genuinely useful and a clean verb.

Blocked by the standing rule that we do not multiply attacker-controlled fetch. Relay already
carries that risk once, with an SSRF guard and a DoH check per run. `tee` would carry it N times
per request, with the customer choosing N. Only worth revisiting if destinations require domain
verification first, and that is a different amount of work than the feature.

## A different product: data lookups

Moved off the candidate list on 2026-09-25 because they hold no state and are not operations.
Recorded rather than deleted: the demand is real, it is just not this product.

- **Email validation** — syntax, MX lookup, disposable-domain list. The DoH code in Relay's URL
  guard already does the hard network part, and the incumbents charge absurd money. But the work
  is maintaining a disposable-domain list forever, which is data janitoring, not a guarantee.
- **Business-day calendar** — is 2 January a banking day in Norway? Static data, updated once a
  year, needed constantly by payroll and invoicing. Same objection: the product *is* the dataset.
- **Caller geo** — Cloudflare hands over country, city and ASN free on every request via
  `request.cf`. Nearly free to serve, and precisely why nobody pays for it.

If any of these ever ships it should be under a different name, because "one API key for a family
of stateful operations" stops being the pitch.

## Deliberately not

- **Sending email.** Deliverability is a full-time profession: SPF, DKIM, IP warming, blocklists.
  One spamming customer ruins the reputation for everyone.
- **Auth, OTP, magic links.** The liability is enormous and the bugs are breaches.
- **Generic KV or Redis.** Upstash owns it, and it is not "one thing". The same objection kills
  "an append-only log you can read back": the moment the shape is "put arbitrary data here", there
  is no guarantee left to sell and no reason to pick us.
- **URL shortener.** Crowded, and an abuse magnet — you become phishing infrastructure by week two.
- **Anything else that fetches a customer-controlled URL.** Relay already carries that risk once,
  with an SSRF guard and a DoH check. Do not multiply it by three.

## Where NanoConfig sits next to LaunchDarkly

It is not LaunchDarkly-minus; it is a different product with an overlapping table.

What they sell and we do not: **targeting**. Rules per user, segment and percentage, evaluated
*locally* by an SDK that holds the flags in memory and receives changes over a stream — so a flag
lookup is a function call, not an HTTP request. On top of that: experiments with metrics,
environments, approval flows, an audit log, RBAC and SSO.

The overlap is the storage, which is the cheap part. The expensive part is the evaluation.

What is true: for one developer with five flags and a kill switch, a JSON document with an ETag
and `If-Match` is the whole need, and LaunchDarkly is priced for a different problem. Same wedge
as flat pricing against per-monitor pricing.

Two things would close the gaps that actually hurt, in this order:

1. **Environments.** `checkout.prod` and `checkout.staging` as separate documents already work
   today — it is a naming convention that needs documenting, not a feature.
2. **Push instead of polling.** A Durable Object holding an SSE connection per subscriber, so a
   change lands in milliseconds and clients stop asking. This is the real gap, and the reason
   their SDK feels instant and ours does not.

Targeting is deliberately *not* next: it is where the complexity lives, and the app that reads the
document can do percentage rollout itself with three lines.

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
