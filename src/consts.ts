// Single source of truth for site copy, services and pricing. The pricing page
// and the front page read from here so they can never drift apart.

export const SITE_TITLE = "nano-api";
export const SITE_DESCRIPTION =
	"Small, sharp APIs that do one thing. NanoPulse tells you when a job you depend on has stopped running. NanoRelay runs the job for you, on schedule, and tells you when that fails.";

export const CONTACT_EMAIL = "hello@nano-api.com";
export const X_URL = "https://x.com/gautes";
export const X_HANDLE = "@gautes";
export const GITHUB_URL = "https://github.com/gsmalano-creator/nano-pulse";
export const PULSE_BASE = "https://pulse.nano-api.com";
export const RELAY_BASE = "https://relay.nano-api.com";

/**
 * Everything is free while the service is young, so there is no plan catalogue
 * — just a default quota you can ask to have raised.
 */
export const DEFAULT_QUOTA = 5;

export const WHAT_YOU_GET = [
	"Both services on one API key",
	"Unlimited pings and unlimited scheduled runs",
	"Slack and webhook alerts, on state changes only",
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
			"The other half of Pulse: we call your endpoint on a schedule, with timezone-correct timing, retries and alerts when it fails.",
		href: "/relay/",
	},
];
