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
};

export default nextConfig;
