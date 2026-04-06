import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const setupConfig = () => {
  if (process.env.NODE_ENV === "development") {
    return nextConfig;
  }
  
  const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
  });
  
  return withPWA(nextConfig);
};

export default setupConfig();
