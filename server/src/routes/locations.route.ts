import { Router } from 'express';
import { locationsRepository } from '../repositories/locations.repository';
import type { CreateLocationBody, LocationCategory } from '../types';

const VALID_CATEGORIES = new Set<LocationCategory>([
  'attraction', 'restaurant', 'accommodation', 'shopping', 'transport',
]);

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await locationsRepository.findAll());
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const location = await locationsRepository.findById(req.params.id);
    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    res.json(location);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body as CreateLocationBody;
    if (
      !body.name ||
      !body.city ||
      body.coordinates?.lng == null ||
      body.coordinates?.lat == null ||
      typeof body.coordinates.lng !== 'number' ||
      typeof body.coordinates.lat !== 'number'
    ) {
      res.status(400).json({ error: 'Missing required fields: name, city, coordinates' });
      return;
    }
    if (!body.category || !VALID_CATEGORIES.has(body.category)) {
      res.status(400).json({ error: 'Invalid or missing category' });
      return;
    }
    if (!body.id) {
      body.id = `${body.city.slice(0, 3).toLowerCase()}-${Date.now()}`;
    }
    const location = await locationsRepository.create(body);
    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
});

export default router;
