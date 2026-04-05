import { useState } from 'react';
import { createLocation } from '../api/locations.api';
import { createItineraryDay } from '../api/itinerary.api';
import { addCity } from '../api/trip.api';
import type { AddItineraryPayload } from '../types';

export function useCreateItinerary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: AddItineraryPayload): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // addCity is idempotent (server no-ops if city already exists), so run it first.
      // This way if location/day creation fails, no committed data is left behind.
      await addCity(payload.day.city);
      await createLocation(payload.location);
      await createItineraryDay(payload.day);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      throw e; // re-throw so the page can handle navigation
    } finally {
      setIsLoading(false);
    }
  };

  return { submit, isLoading, error };
}
