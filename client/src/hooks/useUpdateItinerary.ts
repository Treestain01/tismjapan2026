import { useState } from 'react';
import { updateLocation } from '../api/locations.api';
import { updateItineraryDay, createItineraryDay } from '../api/itinerary.api';
import type { UpdateItineraryPayload } from '../types';

export function useUpdateItinerary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: UpdateItineraryPayload): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // Update all locations in parallel
      await Promise.all(
        payload.locationUpdates.map(({ id, body }) => updateLocation(id, body)),
      );

      if (payload.oldDay === payload.newDay) {
        // Same day — update in place
        await updateItineraryDay(payload.oldDay, payload.day);
      } else {
        // Date changed — strip all edited locationIds from old day, create/append to new day
        const editedIds = new Set(payload.locationUpdates.map(u => u.id));
        await updateItineraryDay(payload.oldDay, {
          date: payload.oldDayDate,
          city: payload.oldDayCity,
          title: payload.oldDayTitle,
          locationIds: payload.oldDayLocationIds.filter(id => !editedIds.has(id)),
          events: [],
        });
        await createItineraryDay({
          day: payload.newDay,
          date: payload.day.date,
          city: payload.day.city,
          title: payload.day.title,
          locationIds: payload.locationUpdates.map(u => u.id),
          events: payload.day.events,
        });
      }
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { submit, isLoading, error };
}
