# Roadmap

What is promised in public, what is parked, and why. `SERVICES` in `src/consts.ts` is the public
list — only put something there once you intend to be asked about it.

## Live

**NanoPulse** — `pulse.nano-api.com`. Heartbeat monitoring. Shipped 2026-09-22.

## Next: NanoRelay (on the site as "planned")

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
