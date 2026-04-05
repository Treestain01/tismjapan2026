import { useState, useRef } from 'react';
import { extractLocation } from '../api/extract.api';
import type { ExtractedLocation } from '../types';

type ExtractionState = 'idle' | 'loading' | 'success' | 'error';

export function useExtractLocation() {
  const [state, setState] = useState<ExtractionState>('idle');
  const [data, setData] = useState<ExtractedLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Incremented on each call; stale responses whose sequence doesn't match are discarded
  const sequenceRef = useRef(0);

  const extract = async (mapsUrl: string) => {
    const seq = ++sequenceRef.current;
    setState('loading');
    setError(null);
    try {
      const result = await extractLocation(mapsUrl);
      if (seq !== sequenceRef.current) return; // stale — a newer call superseded this one
      setData(result);
      setState('success');
    } catch (e) {
      if (seq !== sequenceRef.current) return;
      setError((e as Error).message);
      setState('error');
    }
  };

  const reset = () => {
    setState('idle');
    setData(null);
    setError(null);
  };

  return { state, data, error, extract, reset };
}
