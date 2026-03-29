import locationsData from '../data/locations.json';
import type { Location } from '../types';

export const locationsRepository = {
  findAll: (): Location[] => locationsData as Location[],
  findById: (id: string): Location | undefined =>
    (locationsData as Location[]).find(l => l.id === id),
};
