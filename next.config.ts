import type { NextConfig } from "next";

const nextConfig: NextConfig = {

	sassOptions: {
		silenceDeprecations: ['legacy-js-api'],
	},
	experimental: {
		optimizePackageImports: ["@heroui/react"],
		parallelServerCompiles: true,
		ppr: false,
		webpackBuildWorker: true,
	},
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "lh3.googleusercontent.com", port: "" },
			{ protocol: "https", hostname: "media1.tenor.com", port: "" },
			{ protocol: "https", hostname: "media.tenor.com", port: "" },
			{ protocol: "https", hostname: "nerd-trivia-3k.pockethost.io", port: "" },
			{ protocol: "https", hostname: "i.scdn.co", port: "" },
			{ protocol: "https", hostname: "is1-ssl.mzstatic.com", port: "" },
			{ protocol: "https", hostname: "is2-ssl.mzstatic.com", port: "" },
			{ protocol: "https", hostname: "is3-ssl.mzstatic.com", port: "" },
			{ protocol: "https", hostname: "is4-ssl.mzstatic.com", port: "" },
			{ protocol: "https", hostname: "is5-ssl.mzstatic.com", port: "" },
		]
	}
};

export default nextConfig;