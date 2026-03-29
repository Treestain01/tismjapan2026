import { useState, useEffect } from 'react';
import { fetchJPYtoAUD } from '../api/currency.api';

const CACHE_KEY = 'tism-jpy-aud-rate';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedRate {
  rate: number;
  rateDate: string;
  fetchedAt: number;
}

function formatRateDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getCachedEntry(): { rate: number; rateDate: string } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRate = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) return null;
    return { rate: cached.rate, rateDate: cached.rateDate };
  } catch {
    return null;
  }
}

function setCachedRate(rate: number, rateDate: string): void {
  try {
    const entry: CachedRate = { rate, rateDate, fetchedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage unavailable — silently skip caching
  }
}

export function useCurrencyRate() {
  const [rate, setRate] = useState<number | null>(() => getCachedEntry()?.rate ?? null);
  const [rateDate, setRateDate] = useState<string | null>(() => getCachedEntry()?.rateDate ?? null);
  const [isLoading, setIsLoading] = useState(rate === null);

  useEffect(() => {
    if (rate !== null) return; // already have a valid cached rate
    let cancelled = false;

    fetchJPYtoAUD()
      .then(({ rate: r, date }) => {
        if (cancelled) return;
        const formattedDate = formatRateDate(date);
        setRate(r);
        setRateDate(formattedDate);
        setCachedRate(r, formattedDate);
      })
      .catch(() => {
        // Rate unavailable — silently fail, AUD display hidden
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [rate]);

  return { rate, isLoading, rateDate };
}
