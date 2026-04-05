import { Router } from 'express';
import { extractFromMapsUrl, MAPS_ALLOWED_HOSTNAMES } from '../services/mapsExtract.service';

const router = Router();

// Safe-to-forward error messages produced by extractFromMapsUrl
const SAFE_EXTRACTION_ERRORS = new Set([
  'Invalid URL',
  'URL must be a Google Maps link',
  'Could not resolve short URL',
  'Could not resolve Maps link — network error or timeout',
  'Could not extract coordinates from Maps URL',
]);

router.post('/', async (req, res) => {
  const { mapsUrl } = req.body as { mapsUrl?: string };
  if (!mapsUrl || typeof mapsUrl !== 'string') {
    res.status(400).json({ error: 'mapsUrl is required' });
    return;
  }
  // Basic URL validity check before hitting the service
  let hostname: string;
  try {
    hostname = new URL(mapsUrl).hostname;
  } catch {
    res.status(400).json({ error: 'mapsUrl is not a valid URL' });
    return;
  }
  if (!MAPS_ALLOWED_HOSTNAMES.has(hostname)) {
    res.status(400).json({ error: 'URL must be a Google Maps link' });
    return;
  }
  try {
    const extracted = await extractFromMapsUrl(mapsUrl);
    res.json(extracted);
  } catch (e) {
    const msg = (e as Error).message;
    const safeMsg = SAFE_EXTRACTION_ERRORS.has(msg)
      ? msg
      : 'Could not extract location data from this link';
    res.status(422).json({ error: safeMsg });
  }
});

export default router;
