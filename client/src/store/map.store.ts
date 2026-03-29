import { create } from 'zustand';

interface MapStore {
  selectedLocationId: string | null;
  hoveredLocationId: string | null;
  setSelectedLocation: (id: string | null) => void;
  setHoveredLocation: (id: string | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  selectedLocationId: null,
  hoveredLocationId: null,
  setSelectedLocation: (id) => set({ selectedLocationId: id }),
  setHoveredLocation: (id) => set({ hoveredLocationId: id }),
}));
