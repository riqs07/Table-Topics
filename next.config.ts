// Load the type that describes valid Next.js settings
import type { NextConfig } from "next";

// Next.js settings for VoiceLab
const nextConfig: NextConfig = {
  // Turn on extra React checks that catch bugs during development
  reactStrictMode: true,
  // Let the development server be opened through a Cloudflare quick tunnel, so the app can be tried on a phone over HTTPS (development only)
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Security headers (from the Next.js PWA guide)
  async headers() {
    // One rule for every page, one for the service worker
    return [
      {
        // Every page
        source: "/(.*)",
        headers: [
          // Stop browsers guessing file types
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Stop other sites framing the app
          { key: "X-Frame-Options", value: "DENY" },
          // Send only the site name when following links out
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Allow the microphone for this site only; block camera and location
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        ],
      },
      {
        // The service worker file
        source: "/sw.js",
        headers: [
          // Serve it as JavaScript
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          // Never cache the worker itself, so updates arrive
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          // Only allow scripts from this site
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

// Hand the settings to Next.js
export default nextConfig;
