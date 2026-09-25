// Single source of truth for site copy and the service list. Every page reads
// from here, so the services can never drift apart between pages. The copy never
// states how many there are: the list grows, and a hardcoded count goes stale in
// nine places at once.

export const SITE_TITLE = "nano-api";
export const SITE_DESCRIPTION =
	"A heartbeat monitor for cron jobs, scheduled HTTP calls with real timezone handling, a lease-based lock, a versioned JSON config document, and an atomic counter. HTTP endpoints, one API key, and a read-only dashboard you open with a key instead of a password. Free.";

export const CONTACT_EMAIL = "hello@nano-api.com";

/** Signup is one unauthenticated call; every page shows the same line. */
export const SIGNUP_CURL = `curl -X POST https://pulse.nano-api.com/v1/signup \\
  -H 'content-type: application/json' -d '{"email":"you@example.com"}'`;
export const X_URL = "https://x.com/gautes";
export const X_HANDLE = "@gautes";
export const DASH_URL = "https://dash.nano-api.com";
export const GITHUB_URL = "https://github.com/gsmalano-creator/nano-pulse";
/** A real deployment on someone's own server, using every service. */
export const EXAMPLE_URL = "https://underdata.no/marketwatch/";
export const EXAMPLE_REPO = "https://github.com/gsmalano-creator/nano-marketwatch";
export const PULSE_BASE = "https://pulse.nano-api.com";
export const RELAY_BASE = "https://relay.nano-api.com";
export const LOCK_BASE = "https://lock.nano-api.com";
export const CONFIG_BASE = "https://configmaps.nano-api.com";
export const COUNT_BASE = "https://count.nano-api.com";
export const UNIQ_BASE = "https://uniq.nano-api.com";

/** How many monitors, schedules, configs or counters a new key can create. */
export const DEFAULT_QUOTA = 5;

export type Service = {
	name: string;
	status: "live" | "building" | "planned";
	host: string;
	summary: string;
	href?: string;
};

export const SERVICES: Service[] = [
	{
		name: "NanoPulse",
		status: "live",
		host: "pulse.nano-api.com",
		summary:
			"Your job pings on success. Miss the deadline and it posts to your webhook once, then once more when the pings come back.",
		href: "/pulse/",
	},
	{
		name: "NanoRelay",
		status: "live",
		host: "relay.nano-api.com",
		summary:
			"Cron expressions evaluated in the timezone you name, not UTC. Three attempts with backoff, run history kept.",
		href: "/relay/",
	},
	{
		name: "NanoConfig",
		status: "live",
		host: "configmaps.nano-api.com",
		summary:
			"A versioned JSON document. ETag on reads, If-Match on writes, last 20 revisions kept with a note.",
		href: "/config/",
	},
	{
		name: "NanoCount",
		status: "live",
		host: "count.nano-api.com",
		summary:
			"A named counter incremented in one statement, so two callers are never handed the same number. Which is exactly what an invoice sequence needs, so it does that too.",
		href: "/count/",
	},
	{
		name: "NanoUniq",
		status: "live",
		host: "uniq.nano-api.com",
		summary:
			"You hand it a key you already have; it says whether that key has arrived before. Duplicate webhook deliveries stop being a problem you solve with a table.",
		href: "/uniq/",
	},
	{
		name: "NanoLock",
		status: "live",
		host: "lock.nano-api.com",
		summary:
			"A lease with a TTL and a monotonic fence counter. Expires on its own if the holder dies mid-job.",
		href: "/lock/",
	},
];
