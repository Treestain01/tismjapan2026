import { motion } from 'framer-motion';
import { categoryConfig } from '../../utils/categoryConfig';
import { mapMessages } from '../../messages/map.messages';
import type { Location } from '../../types';

interface LocationHoverTooltipProps {
  location: Location;
}

export function LocationHoverTooltip({ location }: LocationHoverTooltipProps) {
  const config = categoryConfig[location.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-30 pointer-events-none"
    >
      <div className="backdrop-blur-md bg-white/10 dark:bg-black/40 border border-white/20 rounded-xl p-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: config.colour }}
          />
          <span className="text-xs text-muted font-medium">{config.label}</span>
        </div>
        <p className="text-text-base text-sm font-semibold leading-tight">{location.name}</p>
        <p className="text-muted text-xs mt-1 leading-relaxed line-clamp-2">{location.summary}</p>
        <p className="text-accent text-xs mt-2 font-medium">{mapMessages.hoverCta}</p>
      </div>
    </motion.div>
  );
}
