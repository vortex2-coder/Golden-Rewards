import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  pageExtensions: ["ts", "tsx"],
};

export default nextConfig;
