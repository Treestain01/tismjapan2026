import { useCallback, useState } from 'react';
import { Marker } from 'react-map-gl';
import { motion } from 'framer-motion';
import { useMapStore } from '../../store/map.store';
import { categoryConfig } from '../../utils/categoryConfig';
import { LocationHoverTooltip } from './LocationHoverTooltip';
import type { Location } from '../../types';

interface LocationPinProps {
  location: Location;
}

export function LocationPin({ location }: LocationPinProps) {
  const { selectedLocationId, setSelectedLocation, setHoveredLocation } = useMapStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const config = categoryConfig[location.category];
  const isSelected = selectedLocationId === location.id;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLocation(location.id);
  }, [location.id, setSelectedLocation]);

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
    setHoveredLocation(location.id);
  }, [location.id, setHoveredLocation]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
    setHoveredLocation(null);
  }, [setHoveredLocation]);

  return (
    <Marker
      longitude={location.coordinates.lng}
      latitude={location.coordinates.lat}
      anchor="bottom"
    >
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Tooltip */}
        {showTooltip && !isSelected && (
          <LocationHoverTooltip location={location} />
        )}

        {/* Pin */}
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          aria-label={`View details for ${location.name}`}
          className="flex items-center justify-center w-9 h-9 rounded-full shadow-lg cursor-pointer border-2 border-white/30 transition-shadow"
          style={{
            backgroundColor: config.colour,
            boxShadow: isSelected ? `0 0 0 3px ${config.colour}60, 0 4px 12px rgba(0,0,0,0.4)` : undefined,
          }}
        >
          <config.Icon size={16} color="white" />
        </motion.button>
      </div>
    </Marker>
  );
}
