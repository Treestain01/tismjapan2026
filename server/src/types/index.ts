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
  city: 'Fukuoka' | 'Nagasaki' | 'Kagoshima' | 'Yufuin';
  summary: string;
  description: string;
  address: string;
  openingHours: string | null;
  estimatedCost: string | null;
  itineraryDays: number[];
  imageUrls: string[];
  externalLinks: { label: string; url: string }[];
}

export interface ItineraryEvent {
  time: string;
  label: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  city: string;
  title: string;
  locationIds: string[];
  events?: ItineraryEvent[];
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

export interface CreateLocationBody {
  id: string;
  name: string;
  category: LocationCategory;
  coordinates: { lng: number; lat: number };
  city: string;
  summary: string;
  description: string;
  address: string;
  openingHours?: string | null;
  estimatedCost?: string | null;
  itineraryDays: number[];
  imageUrls: string[];
  externalLinks: { label: string; url: string }[];
}

export interface CreateItineraryDayBody {
  day: number;
  date: string;
  city: string;
  title: string;
  locationIds: string[];
  events?: { time: string; label: string }[];
}

export interface ExtractedLocation {
  name: string;
  coordinates: { lng: number; lat: number };
  mapsUrl: string;
  address: string;
}

export interface AddItineraryPayload {
  day: CreateItineraryDayBody;
  location: CreateLocationBody;
}

export interface UpdateLocationBody {
  name: string;
  category: LocationCategory;
  coordinates: { lng: number; lat: number };
  city: string;
  summary: string;
  description: string;
  address: string;
  openingHours?: string | null;
  estimatedCost?: string | null;
  itineraryDays: number[];
  imageUrls: string[];
  externalLinks: { label: string; url: string }[];
}

export interface UpdateItineraryDayBody {
  date: string;
  city: string;
  title: string;
  locationIds: string[];
  events?: { time: string; label: string }[];
}
