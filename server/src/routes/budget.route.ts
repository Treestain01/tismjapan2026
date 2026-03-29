import { Router } from 'express';
import { budgetRepository } from '../repositories/budget.repository';

const router = Router();

router.get('/', (_req, res) => {
  res.json(budgetRepository.get());
});

export default router;
