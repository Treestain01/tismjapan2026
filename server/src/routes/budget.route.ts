import { Router } from 'express';
import { budgetRepository } from '../repositories/budget.repository';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await budgetRepository.get());
  } catch (err) {
    next(err);
  }
});

export default router;
