import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useLocations } from '../hooks/useLocations';
import { useBudget } from '../hooks/useBudget';
import { useCurrencyRate } from '../hooks/useCurrencyRate';
import { useMapStore } from '../store/map.store';
import { categoryConfig } from '../utils/categoryConfig';
import { parseJPY, formatAUDCents, formatAUDRounded } from '../utils/currency';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { budgetMessages } from '../messages/budget.messages';
import { commonMessages } from '../messages/common.messages';
import type { Location, LocationCategory } from '../types';

const CATEGORY_ORDER: LocationCategory[] = [
  'accommodation',
  'restaurant',
  'attraction',
  'shopping',
  'transport',
];

function formatJPYDisplay(cost: string | null): string {
  if (!cost) return budgetMessages.costUnknown;
  if (cost.toLowerCase() === 'free') return budgetMessages.costFree;
  if (cost.toLowerCase() === 'varies') return budgetMessages.costVaries;
  return cost;
}

interface LocationRowProps {
  location: Location;
  rate: number | null;
  onViewMap: (id: string) => void;
}

function LocationRow({ location, rate, onViewMap }: LocationRowProps) {
  const display = formatJPYDisplay(location.estimatedCost);
  const jpyValue = parseJPY(location.estimatedCost);
  const audDisplay = rate && jpyValue !== null ? formatAUDCents(jpyValue, rate) : null;
  const isFree = display === budgetMessages.costFree;
  const isUnknown = display === budgetMessages.costUnknown || display === budgetMessages.costVaries;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-bg last:border-0 group">
      {/* Name + city */}
      <div className="flex-1 min-w-0">
        <p className="text-text-base text-sm font-medium truncate">{location.name}</p>
        <p className="text-muted text-xs">{location.city}</p>
      </div>

      {/* Cost — JPY + AUD */}
      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-semibold tabular-nums ${
            isFree ? 'text-success' : isUnknown ? 'text-muted' : 'text-text-base'
          }`}
        >
          {display}
        </p>
        {audDisplay && !isFree && !isUnknown && (
          <p className="text-muted text-xs tabular-nums">{audDisplay}</p>
        )}
      </div>

      {/* Map link */}
      <button
        onClick={() => onViewMap(location.id)}
        aria-label={`${budgetMessages.viewOnMap}: ${location.name}`}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer flex-shrink-0 opacity-60 group-hover:opacity-100"
      >
        <MapPin size={11} />
        {budgetMessages.viewOnMap}
      </button>
    </div>
  );
}

export function BudgetPage() {
  const navigate = useNavigate();
  const { data: locations, isLoading: locLoading, error: locError } = useLocations();
  const { data: budget, isLoading: budgetLoading } = useBudget();
  const { rate, isLoading: rateLoading, rateDate } = useCurrencyRate();
  const { setSelectedLocation } = useMapStore();

  const isLoading = locLoading || budgetLoading;

  const handleViewMap = (id: string) => {
    setSelectedLocation(id);
    navigate('/map');
  };

  const byCategory = useMemo(
    () =>
      locations
        ? CATEGORY_ORDER.reduce<Record<LocationCategory, Location[]>>(
            (acc, cat) => {
              acc[cat] = locations.filter(l => l.category === cat);
              return acc;
            },
            {} as Record<LocationCategory, Location[]>
          )
        : null,
    [locations]
  );

  return (
    <main className="pt-20 min-h-dvh">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-text-base text-4xl font-bold mb-1">{budgetMessages.pageTitle}</h1>
            <p className="text-muted text-sm">{budgetMessages.pageSubtitle}</p>
          </div>

          {/* Grand total */}
          {budget && (
            <div className="text-right flex-shrink-0">
              <p className="text-muted text-xs font-medium uppercase tracking-wider mb-0.5">
                {budgetMessages.totalLabel}
              </p>
              <p className="text-accent text-3xl font-bold tabular-nums leading-tight">
                {`¥${budget.totalEstimatedJPY.toLocaleString('en-AU')}`}
              </p>
              {rate && (
                <p className="text-muted text-sm tabular-nums mt-0.5">
                  {formatAUDRounded(budget.totalEstimatedJPY, rate)}
                </p>
              )}
              {rateLoading && (
                <p className="text-muted text-xs mt-0.5">{budgetMessages.rateLoading}</p>
              )}
            </div>
          )}
          {budgetLoading && <SkeletonLoader className="w-32 h-14" />}
        </div>

        {/* Rate source note */}
        {rate && rateDate && (
          <p className="text-muted text-xs mb-8">
            {budgetMessages.rateSource} · {rateDate}
          </p>
        )}
        {!rate && !rateLoading && <div className="mb-8" />}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} className="w-full h-32" />
            ))}
          </div>
        )}

        {/* Error */}
        {locError && <p className="text-error">{commonMessages.error}</p>}

        {/* Category sections */}
        {byCategory && (
          <div className="space-y-4">
            {CATEGORY_ORDER.map(cat => {
              const locs = byCategory[cat];
              const cfg = categoryConfig[cat];
              const subtotalJPY = budget?.breakdown.find(b => b.category === cat)?.totalJPY;

              return (
                <div key={cat} className="rounded-2xl bg-surface border border-bg overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-bg">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: cfg.colour }}
                      >
                        <cfg.Icon size={13} color="white" />
                      </div>
                      <span className="text-text-base font-semibold text-sm">{cfg.label}</span>
                    </div>

                    {subtotalJPY !== undefined && (
                      <div className="text-right">
                        <p className="text-muted text-sm font-medium tabular-nums">
                          {budgetMessages.subtotalLabel}{' '}
                          {`¥${subtotalJPY.toLocaleString('en-AU')}`}
                        </p>
                        {rate && (
                          <p className="text-muted text-xs tabular-nums">
                            {formatAUDRounded(subtotalJPY, rate)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Locations */}
                  <div className="px-4">
                    {locs.length === 0 ? (
                      <p className="text-muted text-sm py-3">{budgetMessages.noLocationsInCategory}</p>
                    ) : (
                      locs.map(loc => (
                        <LocationRow
                          key={loc.id}
                          location={loc}
                          rate={rate}
                          onViewMap={handleViewMap}
                        />
                      ))
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
