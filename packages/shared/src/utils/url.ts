/**
 * Normalize a URL for storage.
 * - Lowercases protocol + host
 * - Removes default ports (80, 443)
 * - Removes trailing slash on bare paths
 * - Preserves path, query, fragment
 */
export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    let normalized = `${url.protocol}//${url.hostname}`;
    if (url.port && url.port !== "80" && url.port !== "443") {
      normalized += `:${url.port}`;
    }
    const path = url.pathname.replace(/\/+$/, "") || "";
    normalized += path;
    if (url.search) normalized += url.search;
    return normalized.toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
}

/**
 * Extract domain (host + optional non-default port) from a URL.
 * Used for duplicate project detection — one project per domain.
 * "https://hellospace.studio/tr" and "https://hellospace.studio" → "hellospace.studio"
 */
export function extractDomain(raw: string): string {
  try {
    const url = new URL(raw);
    let domain = url.hostname.toLowerCase();
    if (url.port && url.port !== "80" && url.port !== "443") {
      domain += `:${url.port}`;
    }
    return domain;
  } catch {
    return raw.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  }
}
