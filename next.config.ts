import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
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