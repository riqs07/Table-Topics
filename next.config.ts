// Load the type that describes valid Next.js settings
import type { NextConfig } from "next";

// Next.js settings for VoiceLab
const nextConfig: NextConfig = {
  // Turn on extra React checks that catch bugs during development
  reactStrictMode: true,
};

// Hand the settings to Next.js
export default nextConfig;
