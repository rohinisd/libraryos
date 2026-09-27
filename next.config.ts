import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stamps every page with the deployment it came from (data-dpl-id on <html>).
  // VersionWatcher compares that against /api/public/version so installed PWAs
  // pick up a new deploy on their own. Unset locally, which turns the check off.
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA,
};

export default nextConfig;
