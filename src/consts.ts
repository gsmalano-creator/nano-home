// Single source of truth for site copy, services and pricing. The pricing page
// and the front page read from here so they can never drift apart.

export const SITE_TITLE = "nano-api";
export const SITE_DESCRIPTION =
	"Five small services for the unglamorous bits every project needs: heartbeat monitoring for cron jobs, scheduled calls, locks, config and counters. One API key, no dashboard, nothing to run.";

export const CONTACT_EMAIL = "hello@nano-api.com";

/** Signup is one unauthenticated call; every page shows the same line. */
export const SIGNUP_CURL = `curl -X POST https://pulse.nano-api.com/v1/signup \\
  -H 'content-type: application/json' -d '{"email":"you@example.com"}'`;
export const X_URL = "https://x.com/gautes";
export const X_HANDLE = "@gautes";
export const GITHUB_URL = "https://github.com/gsmalano-creator/nano-pulse";
/** A real deployment on someone's own server, using every service. */
export const EXAMPLE_URL = "https://underdata.no/marketwatch/";
export const EXAMPLE_REPO = "https://github.com/gsmalano-creator/nano-marketwatch";
export const PULSE_BASE = "https://pulse.nano-api.com";
export const RELAY_BASE = "https://relay.nano-api.com";
export const LOCK_BASE = "https://lock.nano-api.com";
export const CONFIG_BASE = "https://configmaps.nano-api.com";
export const COUNT_BASE = "https://count.nano-api.com";

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
	emoji: string;
	status: "live" | "building" | "planned";
	host: string;
	summary: string;
	href?: string;
};

export const SERVICES: Service[] = [
	{
		name: "NanoPulse",
		emoji: "💓",
		status: "live",
		host: "pulse.nano-api.com",
		summary:
			"Your job pings us when it finishes. If a ping goes missing, you hear about it — usually before anyone else notices.",
		href: "/pulse/",
	},
	{
		name: "NanoRelay",
		emoji: "⏰",
		status: "live",
		host: "relay.nano-api.com",
		summary:
			"We call your endpoint on a schedule, in your own timezone. It retries a failure, and tells you if it keeps failing.",
		href: "/relay/",
	},
	{
		name: "NanoConfig",
		emoji: "🎛️",
		status: "live",
		host: "configmaps.nano-api.com",
		summary:
			"A small JSON document you can change from anywhere. Flip a switch mid-incident without a deploy.",
		href: "/config/",
	},
	{
		name: "NanoCount",
		emoji: "🔢",
		status: "live",
		host: "count.nano-api.com",
		summary:
			"Count anything, then show the number as a small image. Two things counting at the same moment both land.",
		href: "/count/",
	},
	{
		name: "NanoLock",
		emoji: "🔒",
		status: "live",
		host: "lock.nano-api.com",
		summary:
			"Only one instance runs the job. The lock lets go by itself if whoever held it disappears.",
		href: "/lock/",
	},
];
