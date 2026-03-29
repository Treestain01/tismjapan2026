import budgetData from '../data/budget.json';
import type { BudgetSummary } from '../types';

export const budgetRepository = {
  get: (): BudgetSummary => budgetData as BudgetSummary,
};
