import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, PencilLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useItinerary } from '../hooks/useItinerary';
import { useLocations } from '../hooks/useLocations';
import { useMapStore } from '../store/map.store';
import { Badge } from '../components/ui/Badge';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { categoryConfig } from '../utils/categoryConfig';
import { itineraryMessages } from '../messages/itinerary.messages';
import { commonMessages } from '../messages/common.messages';
import { editMessages } from '../messages/edit.messages';
import type { ItineraryEvent, Location } from '../types';

function TimedEventRow({ event }: { event: ItineraryEvent }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-bg last:border-0">
      <div className="flex items-center gap-1.5 w-14 flex-shrink-0">
        <Clock size={12} className="text-accent flex-shrink-0" />
        <span className="text-accent text-xs font-semibold tabular-nums">{event.time}</span>
      </div>
      <p className="text-text-base text-sm">{event.label}</p>
    </div>
  );
}

interface LocationRowProps {
  location: Location;
  onViewMap: (id: string) => void;
}

function LocationRow({ location, onViewMap }: LocationRowProps) {
  const cfg = categoryConfig[location.category];
  return (
    <button
      onClick={() => onViewMap(location.id)}
      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-bg transition-colors text-left cursor-pointer group"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: cfg.colour }}
      >
        <cfg.Icon size={13} color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-base text-sm font-medium truncate group-hover:text-accent transition-colors">
          {location.name}
        </p>
        <p className="text-muted text-xs truncate">{location.summary}</p>
      </div>
      <Badge label={cfg.label} colour={cfg.colour} />
    </button>
  );
}

export function ItineraryPage() {
  const { data: days, isLoading, error } = useItinerary();
  const { data: locations } = useLocations();
  const { setSelectedLocation } = useMapStore();
  const navigate = useNavigate();

  const handleLocationClick = useCallback((locationId: string) => {
    setSelectedLocation(locationId);
    navigate('/map');
  }, [setSelectedLocation, navigate]);

  return (
    <main className="pt-20 min-h-dvh">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-text-base text-4xl font-bold mb-2">{itineraryMessages.pageTitle}</h1>
        <p className="text-muted mb-10">{itineraryMessages.pageSubtitle}</p>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} className="w-full h-32" />
            ))}
          </div>
        )}

        {error && <p className="text-error">{commonMessages.error}</p>}

        {days && (
          <div className="space-y-4">
            {days.map(day => {
              const dayLocations = locations?.filter(l => day.locationIds.includes(l.id)) ?? [];
              const sortedEvents = day.events
                ? [...day.events].sort((a, b) => a.time.localeCompare(b.time))
                : [];
              const hasEvents = sortedEvents.length > 0;
              const hasLocations = dayLocations.length > 0;

              return (
                <div key={day.day} className="rounded-2xl bg-surface border border-bg overflow-hidden group">
                  {/* Day header */}
                  <div className="p-4 border-b border-bg flex items-center justify-between">
                    <div>
                      <span className="text-accent text-sm font-semibold">
                        {itineraryMessages.dayLabel} {day.day}
                      </span>
                      <h2 className="text-text-base font-bold text-lg">{day.title}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/edit/${day.day}`)}
                        aria-label={editMessages.editDayAriaLabel}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 text-xs font-semibold cursor-pointer"
                      >
                        <PencilLine size={12} />
                        {editMessages.editButtonLabel}
                      </motion.button>
                      <div className="text-right">
                        <p className="text-muted text-xs">{day.city}</p>
                        <p className="text-muted text-xs">
                          {new Date(day.date + 'T00:00:00').toLocaleDateString('en-AU', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timed events */}
                  {hasEvents && (
                    <div className="px-4 pt-3 pb-1">
                      {sortedEvents.map((event, i) => (
                        <TimedEventRow key={i} event={event} />
                      ))}
                    </div>
                  )}

                  {/* References locations */}
                  {hasLocations && (
                    <div className="px-4 pt-3 pb-3">
                      <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                        {itineraryMessages.referencesLabel}
                      </p>
                      <div className="space-y-1">
                        {dayLocations.map(loc => (
                          <LocationRow
                            key={loc.id}
                            location={loc}
                            onViewMap={handleLocationClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!hasEvents && !hasLocations && (
                    <div className="px-4 py-4">
                      <p className="text-muted text-sm">{itineraryMessages.noLocations}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
