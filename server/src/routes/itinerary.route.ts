import { Router } from 'express';
import { itineraryRepository } from '../repositories/itinerary.repository';

const router = Router();

router.get('/', (_req, res) => {
  res.json(itineraryRepository.findAll());
});

export default router;
