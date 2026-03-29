import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItinerary } from '../hooks/useItinerary';
import { useLocations } from '../hooks/useLocations';
import { useMapStore } from '../store/map.store';
import { Badge } from '../components/ui/Badge';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { categoryConfig } from '../utils/categoryConfig';
import { itineraryMessages } from '../messages/itinerary.messages';
import { commonMessages } from '../messages/common.messages';

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
              return (
                <div key={day.day} className="rounded-2xl bg-surface border border-bg overflow-hidden">
                  <div className="p-4 border-b border-bg flex items-center justify-between">
                    <div>
                      <span className="text-accent text-sm font-semibold">
                        {itineraryMessages.dayLabel} {day.day}
                      </span>
                      <h2 className="text-text-base font-bold text-lg">{day.title}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-muted text-xs">{day.city}</p>
                      <p className="text-muted text-xs">{new Date(day.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    {dayLocations.length === 0 ? (
                      <p className="text-muted text-sm">{itineraryMessages.noLocations}</p>
                    ) : (
                      <div className="space-y-2">
                        {dayLocations.map(loc => {
                          const cfg = categoryConfig[loc.category];
                          return (
                            <button
                              key={loc.id}
                              onClick={() => handleLocationClick(loc.id)}
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
                                  {loc.name}
                                </p>
                                <p className="text-muted text-xs truncate">{loc.summary}</p>
                              </div>
                              <Badge label={cfg.label} colour={cfg.colour} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
