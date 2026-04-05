import type { ExtractedLocation } from '../types';

export const MAPS_ALLOWED_HOSTNAMES = new Set([
  'maps.google.com',
  'www.google.com',
  'goo.gl',
  'maps.app.goo.gl',
]);

const SHORT_HOSTNAMES = new Set(['goo.gl', 'maps.app.goo.gl']);

export async function extractFromMapsUrl(rawUrl: string): Promise<ExtractedLocation> {
  // Step 1: validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  // Step 2: check known Google Maps hostname
  if (!MAPS_ALLOWED_HOSTNAMES.has(parsedUrl.hostname)) {
    throw new Error('URL must be a Google Maps link');
  }

  // Step 3: resolve short URLs — validate redirect destination BEFORE following
  // (prevents SSRF: we never fetch a URL whose hostname hasn't been allow-listed)
  let canonicalUrlStr = rawUrl;
  if (SHORT_HOSTNAMES.has(parsedUrl.hostname)) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    let redirectResponse: Response;
    try {
      // redirect: 'manual' gives us the Location header without following it
      redirectResponse = await fetch(rawUrl, { redirect: 'manual', signal: controller.signal });
    } catch {
      clearTimeout(timeoutId);
      throw new Error('Could not resolve Maps link — network error or timeout');
    }
    clearTimeout(timeoutId);

    const locationHeader = redirectResponse.headers.get('location');
    if (!locationHeader) {
      throw new Error('Could not resolve short URL');
    }
    let resolvedUrl: URL;
    try {
      resolvedUrl = new URL(locationHeader);
    } catch {
      throw new Error('Could not resolve short URL');
    }
    // Validate resolved hostname before using the URL — no second request needed
    if (!MAPS_ALLOWED_HOSTNAMES.has(resolvedUrl.hostname)) {
      throw new Error('URL must be a Google Maps link');
    }
    canonicalUrlStr = resolvedUrl.href;
  }

  // Step 4: extract coordinates
  const coordMatch = canonicalUrlStr.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!coordMatch) {
    throw new Error('Could not extract coordinates from Maps URL');
  }
  const lat = parseFloat(coordMatch[1]);
  const lng = parseFloat(coordMatch[2]);

  if (
    !isFinite(lat) || !isFinite(lng) ||
    lat < -90 || lat > 90 ||
    lng < -180 || lng > 180
  ) {
    throw new Error('Could not extract coordinates from Maps URL');
  }

  // Step 5: extract place name from URL path
  const placeMatch = canonicalUrlStr.match(/\/maps\/place\/([^/@]+)/);
  let name = 'Unknown Location';
  if (placeMatch) {
    const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
    if (decoded) {
      name = decoded;
    }
  }

  // Step 6: best-effort address = decoded place name
  const address = name;

  return { name, coordinates: { lng, lat }, mapsUrl: rawUrl, address };
}
