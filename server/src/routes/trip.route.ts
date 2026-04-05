import { Router } from 'express';
import { tripRepository } from '../repositories/trip.repository';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await tripRepository.get());
  } catch (err) {
    next(err);
  }
});

router.put('/cities', async (req, res, next) => {
  try {
    const { city } = req.body as { city?: string };
    if (!city || typeof city !== 'string' || !city.trim()) {
      res.status(400).json({ error: 'city is required' });
      return;
    }
    const trimmed = city.trim();
    if (trimmed.length > 100) {
      res.status(400).json({ error: 'city name must be 100 characters or fewer' });
      return;
    }
    const updated = await tripRepository.addCity(trimmed);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
