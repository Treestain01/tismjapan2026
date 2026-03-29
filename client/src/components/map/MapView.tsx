import { useRef, useCallback } from 'react';
import Map, { type MapRef } from 'react-map-gl';
import { useMapStore } from '../../store/map.store';
import { useThemeStore } from '../../store/theme.store';
import { useLocations } from '../../hooks/useLocations';
import { LocationPin } from './LocationPin';
import { LocationPanel } from './LocationPanel';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { mapMessages } from '../../messages/map.messages';

const MAPBOX_TOKEN: string | undefined = import.meta.env.VITE_MAPBOX_TOKEN;

const KYUSHU_CENTER = { lng: 130.35, lat: 32.80 };

export function MapView() {
  const mapRef = useRef<MapRef>(null);
  const { theme } = useThemeStore();
  const { selectedLocationId, setSelectedLocation } = useMapStore();
  const { data: locations, isLoading, error } = useLocations();

  const mapStyle = theme === 'dark'
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';

  const handleMapClick = useCallback(() => {
    setSelectedLocation(null);
  }, [setSelectedLocation]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-dvh bg-bg text-muted">
        <p>Mapbox token not configured. Set VITE_MAPBOX_TOKEN in your .env file.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh">
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <SkeletonLoader className="w-full h-full rounded-none" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted text-sm">{mapMessages.loadingLocations}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-bg">
          <p className="text-error">{mapMessages.errorLocations}</p>
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: KYUSHU_CENTER.lng,
          latitude: KYUSHU_CENTER.lat,
          zoom: 7,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        onClick={handleMapClick}
      >
        {locations?.map(location => (
          <LocationPin key={location.id} location={location} />
        ))}
      </Map>

      {selectedLocationId && locations && (
        <LocationPanel
          location={locations.find(l => l.id === selectedLocationId) ?? null}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
}
