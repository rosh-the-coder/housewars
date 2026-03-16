export function extractGameIdFromEmbedUrl(embedUrl: string): string | null {
  try {
    const url = new URL(embedUrl);
    const fromQuery =
      url.searchParams.get("gameId") ??
      url.searchParams.get("game_id") ??
      url.searchParams.get("id") ??
      url.searchParams.get("game");

    if (fromQuery && fromQuery.trim().length > 0) {
      return fromQuery.trim();
    }

    const pathSegments = url.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (lastSegment && lastSegment.length > 3 && !lastSegment.endsWith(".html")) {
      return lastSegment;
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeGameDistributionEmbedUrl(
  embedUrl: string,
  referrerUrl?: string,
): string {
  try {
    const url = new URL(embedUrl);
    const host = url.hostname.toLowerCase();
    const isGameDistributionHost =
      host === "html5.gamedistribution.com" || host.endsWith(".gamedistribution.com");

    if (!isGameDistributionHost) {
      return embedUrl;
    }

    if (!url.searchParams.get("gd_sdk_referrer_url")) {
      url.searchParams.set("gd_sdk_referrer_url", referrerUrl ?? "http://localhost:3000/games");
    }

    return url.toString();
  } catch {
    return embedUrl;
  }
}
