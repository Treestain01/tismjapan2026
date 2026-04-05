import { Router } from 'express';

const router = Router();

interface FrankfurterResponse {
  date: string;
  rates: Record<string, number>;
}

router.get('/', async (_req, res, next) => {
  try {
    const upstream = await fetch('https://api.frankfurter.app/latest?from=JPY&to=AUD');
    if (!upstream.ok) {
      res.status(502).json({ error: 'Currency service unavailable' });
      return;
    }
    const data = await upstream.json() as FrankfurterResponse;
    const rate = data.rates['AUD'];
    if (rate === undefined || !isFinite(rate) || rate <= 0) {
      res.status(502).json({ error: 'AUD rate not found' });
      return;
    }
    res.json({ rate, date: data.date });
  } catch (err) {
    next(err);
  }
});

export default router;
