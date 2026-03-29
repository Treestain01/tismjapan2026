import { useState, useEffect } from 'react';
import { fetchLocation } from '../api/locations.api';
import type { Location } from '../types';

export function useLocation(id: string) {
  const [data, setData] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchLocation(id)
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { data, isLoading, error };
}
