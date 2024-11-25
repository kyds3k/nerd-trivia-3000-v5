import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
	experimental: {
		optimizePackageImports: ["@nextui-org/react"],
		parallelServerCompiles: true,
		ppr: true,
		webpackBuildWorker: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "media.tenor.com",
				port: ""
			}
		],
	}
};

export default nextConfig;