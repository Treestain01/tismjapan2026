import tripData from '../data/trip.json';
import type { TripInfo } from '../types';

export const tripRepository = {
  get: (): TripInfo => tripData as TripInfo,
};
