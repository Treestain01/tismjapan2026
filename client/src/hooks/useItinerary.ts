import { useState, useEffect } from 'react';
import { fetchItinerary } from '../api/itinerary.api';
import type { ItineraryDay } from '../types';

export function useItinerary() {
  const [data, setData] = useState<ItineraryDay[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchItinerary()
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
