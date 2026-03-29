import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, DollarSign, Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { categoryConfig } from '../../utils/categoryConfig';
import { useCurrencyRate } from '../../hooks/useCurrencyRate';
import { parseJPY, formatAUDCents } from '../../utils/currency';
import { mapMessages } from '../../messages/map.messages';
import { commonMessages } from '../../messages/common.messages';
import type { Location } from '../../types';

interface LocationPanelProps {
  location: Location | null;
  onClose: () => void;
}

export function LocationPanel({ location, onClose }: LocationPanelProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const config = location ? categoryConfig[location.category] : null;

  return (
    <AnimatePresence>
      {location && config && (
        <>
          {/* Mobile overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 md:hidden bg-black/30"
            onClick={onClose}
          />

          {/* Panel -- slides from right on desktop */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-sm bg-surface shadow-2xl hidden md:flex flex-col"
            role="dialog"
            aria-label={`Details for ${location.name}`}
          >
            <PanelContent location={location} config={config} onClose={onClose} />
          </motion.div>

          {/* Mobile bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 right-0 bottom-0 z-40 bg-surface rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col md:hidden"
            role="dialog"
            aria-label={`Details for ${location.name}`}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted/40" />
            </div>
            <PanelContent location={location} config={config} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface PanelContentProps {
  location: Location;
  config: { colour: string; label: string };
  onClose: () => void;
}

function PanelContent({ location, config, onClose }: PanelContentProps) {
  const { rate } = useCurrencyRate();
  const jpyValue = parseJPY(location.estimatedCost);
  const audDisplay = rate && jpyValue !== null ? formatAUDCents(jpyValue, rate) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-bg flex-shrink-0">
        <div className="flex-1 pr-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {config && (
              <Badge label={config.label} colour={config.colour} />
            )}
            {location.itineraryDays.map(day => (
              <Badge key={day} label={String(day)} variant="day" colour="#1B4B8A" />
            ))}
          </div>
          <h2 className="text-text-base font-bold text-lg leading-tight">{location.name}</h2>
          <p className="text-muted text-sm mt-0.5">{location.city}</p>
        </div>
        <button
          onClick={onClose}
          aria-label={commonMessages.close}
          className="p-1.5 rounded-lg text-muted hover:text-text-base hover:bg-bg transition-colors cursor-pointer flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Our Notes */}
        {location.description && (
          <section>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              {mapMessages.panelNotes}
            </h3>
            <p className="text-text-base text-sm leading-relaxed">{location.description}</p>
          </section>
        )}

        {/* Details grid */}
        <section className="space-y-2.5">
          {location.address && (
            <div className="flex gap-2.5">
              <MapPin size={14} className="text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted font-medium">{mapMessages.panelAddress}</p>
                <p className="text-text-base text-sm">{location.address}</p>
              </div>
            </div>
          )}
          {location.openingHours && (
            <div className="flex gap-2.5">
              <Clock size={14} className="text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted font-medium">{mapMessages.panelHours}</p>
                <p className="text-text-base text-sm">{location.openingHours}</p>
              </div>
            </div>
          )}
          {location.estimatedCost && (
            <div className="flex gap-2.5">
              <DollarSign size={14} className="text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted font-medium">{mapMessages.panelCost}</p>
                <p className="text-text-base text-sm">{location.estimatedCost}</p>
                {audDisplay && (
                  <p className="text-muted text-xs mt-0.5">
                    {mapMessages.panelCostAUD} {audDisplay}
                  </p>
                )}
              </div>
            </div>
          )}
          {location.itineraryDays.length > 0 && (
            <div className="flex gap-2.5">
              <Calendar size={14} className="text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted font-medium">{mapMessages.panelDays}</p>
                <p className="text-text-base text-sm">
                  {location.itineraryDays.map(d => `Day ${d}`).join(', ')}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* External links */}
        {location.externalLinks.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              {mapMessages.panelLinks}
            </h3>
            <div className="space-y-1.5">
              {location.externalLinks.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors group"
                >
                  <ExternalLink size={12} className="flex-shrink-0" />
                  <span className="group-hover:underline">{link.label}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
