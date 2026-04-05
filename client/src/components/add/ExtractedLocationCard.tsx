import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { addMessages } from '../../messages/add.messages';
import type { ExtractedLocation } from '../../types';

interface ExtractedLocationCardProps {
  state: 'idle' | 'loading' | 'success' | 'error';
  data: ExtractedLocation | null;
  existingCities: string[];
  title: string;
  noDataText: string;
  newCityText: string;
  existingCityText: string;
}

export function ExtractedLocationCard({
  state,
  data,
  existingCities,
  title,
  noDataText,
  newCityText,
  existingCityText,
}: ExtractedLocationCardProps) {
  // Derive a rough city name from the last-but-one comma-segment of the address
  const cityFromData = (() => {
    if (!data) return '';
    const parts = data.address.split(',');
    return parts.length >= 2 ? (parts[parts.length - 2] ?? '').trim() : '';
  })();
  const cityIsKnown = existingCities.some(
    c => c.toLowerCase() === cityFromData.toLowerCase()
  );

  return (
    <div className="rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 shadow-xl p-6 min-h-[200px] flex flex-col">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">{title}</h3>

      {state === 'idle' && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted text-sm text-center">{noDataText}</p>
        </div>
      )}

      {state === 'loading' && (
        <div className="space-y-3 flex-1">
          <SkeletonLoader className="w-3/4 h-6" />
          <SkeletonLoader className="w-1/2 h-4" />
          <SkeletonLoader className="w-full h-4" />
        </div>
      )}

      <AnimatePresence>
        {state === 'success' && data && (
          <motion.div
            key="extracted-data"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="flex-1 space-y-3"
          >
            <p className="text-lg font-semibold text-text-base">{data.name}</p>
            <span className="block font-mono text-sm text-muted">
              {data.coordinates.lat.toFixed(6)}, {data.coordinates.lng.toFixed(6)}
            </span>
            <p className="text-sm text-text-base">{data.address}</p>
            {cityFromData && (
              <div className="flex items-center gap-2">
                <Badge
                  label={cityIsKnown ? existingCityText : newCityText}
                  colour={cityIsKnown ? 'var(--color-muted)' : 'var(--color-accent)'}
                />
              </div>
            )}
            {data.mapsUrl && (
              <a
                href={data.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
              >
                {addMessages.previewOpenInMaps}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
