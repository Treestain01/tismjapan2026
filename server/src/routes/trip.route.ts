import { Router } from 'express';
import { tripRepository } from '../repositories/trip.repository';

const router = Router();

router.get('/', (_req, res) => {
  res.json(tripRepository.get());
});

export default router;
