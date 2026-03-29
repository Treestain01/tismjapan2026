export type LocationCategory =
  | 'attraction'
  | 'restaurant'
  | 'accommodation'
  | 'shopping'
  | 'transport';

export interface Location {
  id: string;
  name: string;
  category: LocationCategory;
  coordinates: { lng: number; lat: number };
  city: 'Fukuoka' | 'Nagasaki' | 'Kagoshima';
  summary: string;
  description: string;
  address: string;
  openingHours: string | null;
  estimatedCost: string | null;
  itineraryDays: number[];
  imageUrls: string[];
  externalLinks: { label: string; url: string }[];
}

export interface ItineraryDay {
  day: number;
  date: string;
  city: string;
  title: string;
  locationIds: string[];
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  locationId: string | null;
}

export interface BudgetSummary {
  totalEstimatedJPY: number;
  breakdown: { category: LocationCategory; totalJPY: number }[];
}

export interface TripInfo {
  title: string;
  departureDate: string;
  returnDate: string;
  description: string;
  cities: string[];
}
