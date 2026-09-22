// Single source of truth for site copy, services and pricing. The pricing page
// and the front page read from here so they can never drift apart.

export const SITE_TITLE = "nano-api";
export const SITE_DESCRIPTION =
	"Small, sharp APIs that do one thing. NanoPulse tells you when a job you depend on has stopped running — a backup, an export, a queue worker, a server.";

export const CONTACT_EMAIL = "hello@nano-api.com";
export const X_URL = "https://x.com/gautes";
export const X_HANDLE = "@gautes";
export const GITHUB_URL = "https://github.com/gsmalano-creator/nano-pulse";
export const PULSE_BASE = "https://pulse.nano-api.com";

/** The quota that actually gates each plan is `monitors` — see users.monitor_limit. */
export const SHARED_FEATURES = [
	"Unlimited pings",
	"Slack and webhook alerts",
	"Detection within 5 minutes of a missed deadline",
	"Ping payloads up to 2 KB, kept and searchable",
	"Failure reporting (?status=fail) and recovery alerts",
	"Multiple API keys per account, with self-service rotation and revocation",
];

export type Plan = {
	id: string;
	name: string;
	price: string;
	cadence: string;
	monitors: string;
	tagline: string;
	extras: string[];
	featured?: boolean;
};

export const PLANS: Plan[] = [
	{
		id: "free",
		name: "Free",
		price: "$0",
		cadence: "forever",
		monitors: "5 monitors",
		tagline: "For your own scripts and side projects.",
		extras: ["Best-effort support"],
	},
	{
		id: "pro",
		name: "Pro",
		price: "$9",
		cadence: "per month",
		monitors: "50 monitors",
		tagline: "For one team that runs real jobs.",
		extras: ["Email support"],
		featured: true,
	},
	{
		id: "business",
		name: "Business",
		price: "$29",
		cadence: "per month",
		monitors: "500 monitors",
		tagline: "For an entire fleet, across environments.",
		extras: ["Priority email support"],
	},
	{
		id: "custom",
		name: "Custom",
		price: "Let's talk",
		cadence: "",
		monitors: "Unlimited monitors",
		tagline: "For when 500 is not enough.",
		extras: ["Invoicing on request", "Dedicated onboarding"],
	},
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
		href: "/pricing/",
	},
	{
		name: "NanoRelay",
		status: "planned",
		host: "relay.nano-api.com",
		summary:
			"The other half of Pulse: we call your endpoint on a schedule, retry with backoff, and alert when it fails.",
	},
];
