import itineraryData from '../data/itinerary.json';
import type { ItineraryDay } from '../types';

export const itineraryRepository = {
  findAll: (): ItineraryDay[] => itineraryData as ItineraryDay[],
};
