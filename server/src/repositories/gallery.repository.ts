import galleryData from '../data/gallery.json';
import type { GalleryImage } from '../types';

export const galleryRepository = {
  findAll: (): GalleryImage[] => galleryData as GalleryImage[],
};
