import { Router } from 'express';
import { galleryRepository } from '../repositories/gallery.repository';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await galleryRepository.findAll());
  } catch (err) {
    next(err);
  }
});

export default router;
