import type { BudgetSummary } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function fetchBudget(): Promise<BudgetSummary> {
  const res = await fetch(`${BASE}/api/budget`);
  if (!res.ok) throw new Error(`Failed to fetch budget: ${res.status}`);
  return res.json();
}
