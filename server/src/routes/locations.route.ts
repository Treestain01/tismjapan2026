import { Router } from 'express';
import { locationsRepository } from '../repositories/locations.repository';

const router = Router();

router.get('/', (_req, res) => {
  res.json(locationsRepository.findAll());
});

router.get('/:id', (req, res) => {
  const location = locationsRepository.findById(req.params.id);
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  res.json(location);
});

export default router;
