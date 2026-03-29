import { Router } from 'express';
import { galleryRepository } from '../repositories/gallery.repository';

const router = Router();

router.get('/', (_req, res) => {
  res.json(galleryRepository.findAll());
});

export default router;
