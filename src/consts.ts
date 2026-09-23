// Single source of truth for site copy, services and pricing. The pricing page
// and the front page read from here so they can never drift apart.

export const SITE_TITLE = "nano-api";
export const SITE_DESCRIPTION =
	"Small, sharp APIs that each do one thing: notice when a job stops running, run it for you on schedule, and stop two copies running at once. One API key, no dashboard.";

export const CONTACT_EMAIL = "hello@nano-api.com";

/** Signup is one unauthenticated call; every page shows the same line. */
export const SIGNUP_CURL = `curl -X POST https://pulse.nano-api.com/v1/signup \\
  -H 'content-type: application/json' -d '{"email":"you@example.com"}'`;
export const X_URL = "https://x.com/gautes";
export const X_HANDLE = "@gautes";
export const GITHUB_URL = "https://github.com/gsmalano-creator/nano-pulse";
/** A real deployment on someone's own server, using all four services. */
export const EXAMPLE_URL = "https://underdata.no/marketwatch/";
export const EXAMPLE_REPO = "https://github.com/gsmalano-creator/nano-marketwatch";
export const PULSE_BASE = "https://pulse.nano-api.com";
export const RELAY_BASE = "https://relay.nano-api.com";
export const LOCK_BASE = "https://lock.nano-api.com";
export const CONFIG_BASE = "https://configmaps.nano-api.com";

/**
 * Everything is free while the service is young, so there is no plan catalogue
 * — just a default quota you can ask to have raised.
 */
export const DEFAULT_QUOTA = 5;

export const WHAT_YOU_GET = [
	"One API key for every service",
	"Unlimited pings and unlimited scheduled runs",
	"Slack alerts on state changes — one when it breaks, one when it recovers",
	"Detection within 60 seconds of a missed deadline",
	"Ping payloads up to 2 KB, and full run history, through the API",
	"Multiple API keys per account, with self-service rotation and revocation",
];

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
			"Find out when a job you depend on has stopped running. It pings us on success; we alert the moment it goes quiet.",
		href: "/pulse/",
	},
	{
		name: "NanoRelay",
		status: "live",
		host: "relay.nano-api.com",
		summary:
			"We call your endpoint on a schedule, with timezone-correct timing, retries, and alerts when it fails.",
		href: "/relay/",
	},
	{
		name: "NanoConfig",
		status: "live",
		host: "configmaps.nano-api.com",
		summary:
			"Small JSON documents you can change without a deploy. Versioned, conditionally writable, cheap to poll.",
		href: "/config/",
	},
	{
		name: "NanoLock",
		status: "live",
		host: "lock.nano-api.com",
		summary:
			"Stops two of them running at once. A lock with a lease, a token only the holder knows, and a fencing counter.",
		href: "/lock/",
	},
];
