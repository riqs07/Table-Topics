// The page security headers and the development tunnel setting, read by next.config.ts (decision 87); kept free of "@/" imports so the config file can load it

// What the page may load, as one Content-Security-Policy value
export function contentSecurityPolicy(development: boolean): string {
  // One rule per kind of content
  const directives = [
    // Anything not named below comes only from this site
    "default-src 'self'",
    // Scripts from this site, plus inline ones: Next.js writes each page's data into inline scripts that differ per page and build, so they cannot be listed by hash, and naming any hash would make browsers ignore 'unsafe-inline' and block them. Nonces would need every page drawn per request, losing the static, offline-ready pages. While developing, React also needs eval for its error overlay
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
    // Styles from this site, plus the inline theme and the style attributes React sets
    "style-src 'self' 'unsafe-inline'",
    // Images from this site, and ones made in the page
    "img-src 'self' data: blob:",
    // Sound from this site, recordings played back from memory, and the short silence that unlocks playback on phones
    "media-src 'self' blob: data:",
    // Network requests only to this site (the paid services are reached through its own routes), so nothing can be sent elsewhere
    "connect-src 'self'",
    // Fonts are served by this site
    "font-src 'self'",
    // No plug-ins
    "object-src 'none'",
    // No changing where relative addresses point
    "base-uri 'self'",
    // Forms send only to this site
    "form-action 'self'",
    // No other site may frame the app
    "frame-ancestors 'none'",
    // The service worker comes from this site
    "worker-src 'self'",
    // The install manifest comes from this site
    "manifest-src 'self'",
  ];
  // Joined as the header expects
  return directives.join("; ");
}

// Always use HTTPS for two years, subdomains included (browsers ignore it over plain HTTP, so localhost is unaffected)
export const STRICT_TRANSPORT_SECURITY = "max-age=63072000; includeSubDomains";

// The tunnel host names the development server accepts (DEV_TUNNEL_HOST, comma-separated; none by default), so only your own tunnel can reach it
export function devTunnelHosts(source: Record<string, string | undefined>): string[] {
  // Split the setting into names, dropping empty ones
  return (source.DEV_TUNNEL_HOST ?? "").split(",").map((host) => host.trim()).filter((host) => host.length > 0);
}
