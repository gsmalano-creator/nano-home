// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://nano-api.com",
	integrations: [sitemap()],
	// There used to be a pricing page. There is nothing to price, so it says so
	// on /about/ now — but the old URL has been linked, so it keeps working.
	// Astro normalises the two forms into one route, so "/pricing" covers both.
	redirects: {
		"/pricing": "/about/",
	},
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
