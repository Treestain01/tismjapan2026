import { Landmark, Utensils, BedDouble, ShoppingBag, Train, type LucideIcon } from 'lucide-react';
import type { LocationCategory } from '../types';

interface CategoryConfig {
  colour: string;
  Icon: LucideIcon;
  label: string;
}

export const categoryConfig: Record<LocationCategory, CategoryConfig> = {
  attraction:    { colour: '#4A90D9', Icon: Landmark,    label: 'Attraction' },
  restaurant:    { colour: '#E85D4A', Icon: Utensils,    label: 'Restaurant' },
  accommodation: { colour: '#7B68EE', Icon: BedDouble,   label: 'Accommodation' },
  shopping:      { colour: '#F97316', Icon: ShoppingBag, label: 'Shopping' },
  transport:     { colour: '#10B981', Icon: Train,       label: 'Transport' },
};
