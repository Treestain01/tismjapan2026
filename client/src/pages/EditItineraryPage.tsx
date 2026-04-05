import { useState, useEffect, useId } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useItinerary } from '../hooks/useItinerary';
import { useLocations } from '../hooks/useLocations';
import { useUpdateItinerary } from '../hooks/useUpdateItinerary';
import { MapsUrlInput } from '../components/add/MapsUrlInput';
import { EventsList } from '../components/add/EventsList';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { categoryConfig } from '../utils/categoryConfig';
import { extractLocation } from '../api/extract.api';
import { addMessages } from '../messages/add.messages';
import { editMessages } from '../messages/edit.messages';
import type { LocationCategory, UpdateItineraryPayload, UpdateLocationBody } from '../types';

const DEPARTURE = new Date('2026-11-20');

function dateToDayNumber(dateStr: string): number {
  const d = new Date(dateStr);
  const diff = Math.floor((d.getTime() - DEPARTURE.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

type ExtractionState = 'idle' | 'loading' | 'success' | 'error';

interface LocationEntry {
  id: string;
  name: string;
  category: LocationCategory;
  mapsUrl: string;
  originalMapsUrl: string;
  coordinates: { lng: number; lat: number };
  address: string;
  coordsSource: 'existing' | 'extracted';
  extractState: ExtractionState;
  extractError: string | null;
}

interface FormState {
  date: string;
  dayTitle: string;
  city: string;
  events: { id: string; time: string; label: string }[];
  locations: LocationEntry[];
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

const CATEGORY_OPTIONS = Object.keys(categoryConfig) as LocationCategory[];
const REDIRECT_DELAY_MS = 1200;
const labelClass = 'block text-sm font-medium text-text-base mb-1.5';
const inputClass =
  'w-full bg-surface border border-bg rounded-lg px-3 py-2.5 text-sm text-text-base placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/50 transition-all';
const sectionHeadingClass =
  'text-xs font-semibold uppercase tracking-wider text-muted mb-4';

export function EditItineraryPage() {
  const { day: dayParam } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const formId = useId();

  const dayNumber = dayParam ? parseInt(dayParam, 10) : NaN;
  const isValidDay = !isNaN(dayNumber);

  const { data: allDays, isLoading: daysLoading } = useItinerary();
  const { data: allLocations, isLoading: locationsLoading } = useLocations();

  const dayData = isValidDay ? (allDays?.find(d => d.day === dayNumber) ?? null) : null;

  const [form, setForm] = useState<FormState>({
    date: '',
    dayTitle: '',
    city: '',
    events: [],
    locations: [],
  });
  const [prefilled, setPrefilled] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const update = useUpdateItinerary();

  // Pre-fill form once both itinerary and location data are loaded
  useEffect(() => {
    if (prefilled || !dayData || !allLocations) return;

    const dayLocations = dayData.locationIds
      .map(id => allLocations.find(l => l.id === id))
      .filter((l): l is NonNullable<typeof l> => l != null);

    const locationEntries: LocationEntry[] = dayLocations.map(loc => {
      const mapsUrl = loc.externalLinks.find(e => e.label === 'Google Maps')?.url ?? '';
      return {
        id: loc.id,
        name: loc.name,
        category: loc.category,
        mapsUrl,
        originalMapsUrl: mapsUrl,
        coordinates: loc.coordinates,
        address: loc.address,
        coordsSource: 'existing',
        extractState: 'success',
        extractError: null,
      };
    });

    setForm({
      date: dayData.date,
      dayTitle: dayData.title,
      city: dayData.city,
      events: (dayData.events ?? []).map(e => ({ ...e, id: crypto.randomUUID() })),
      locations: locationEntries,
    });
    setPrefilled(true);
  }, [dayData, allLocations, prefilled]);

  const computedDayNumber = form.date ? dateToDayNumber(form.date) : null;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Day-level field handlers ──────────────────────────────────────────────

  const handleDayField = <K extends keyof Omit<FormState, 'locations' | 'events'>>(
    key: K,
    value: FormState[K],
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAddEvent = () => {
    setForm(prev => ({
      ...prev,
      events: [...prev.events, { id: crypto.randomUUID(), time: '', label: '' }],
    }));
  };

  const handleRemoveEvent = (id: string) => {
    setForm(prev => ({ ...prev, events: prev.events.filter(e => e.id !== id) }));
  };

  const handleChangeEvent = (id: string, field: 'time' | 'label', value: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.map(e => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  // ── Per-location field handlers ───────────────────────────────────────────

  const handleLocationField = (
    locId: string,
    field: 'name' | 'category',
    value: string,
  ) => {
    setForm(prev => ({
      ...prev,
      locations: prev.locations.map(l =>
        l.id !== locId ? l : { ...l, [field]: value },
      ),
    }));
  };

  const handleLocationMapsUrlChange = (locId: string, url: string) => {
    setForm(prev => ({
      ...prev,
      locations: prev.locations.map(l => {
        if (l.id !== locId) return l;
        const isOriginal = url === l.originalMapsUrl;
        return {
          ...l,
          mapsUrl: url,
          coordsSource: isOriginal ? 'existing' : 'extracted',
          extractState: isOriginal ? 'success' : 'idle',
          extractError: null,
        };
      }),
    }));
  };

  const handleExtractForLocation = async (locId: string, url: string) => {
    setForm(prev => ({
      ...prev,
      locations: prev.locations.map(l =>
        l.id !== locId ? l : { ...l, extractState: 'loading', extractError: null },
      ),
    }));
    try {
      const result = await extractLocation(url);
      setForm(prev => ({
        ...prev,
        locations: prev.locations.map(l =>
          l.id !== locId
            ? l
            : {
                ...l,
                extractState: 'success',
                coordinates: result.coordinates,
                address: result.address,
                coordsSource: 'extracted',
                extractError: null,
              },
        ),
      }));
    } catch (e) {
      setForm(prev => ({
        ...prev,
        locations: prev.locations.map(l =>
          l.id !== locId
            ? l
            : { ...l, extractState: 'error', extractError: (e as Error).message },
        ),
      }));
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!form.date) {
      setValidationError(addMessages.validationDateRequired);
      return;
    }
    if (!form.dayTitle.trim()) {
      setValidationError(addMessages.validationTitleRequired);
      return;
    }
    if (!form.city.trim()) {
      setValidationError(addMessages.validationCityRequired);
      return;
    }
    for (const loc of form.locations) {
      if (loc.coordsSource === 'extracted' && loc.extractState !== 'success') {
        setValidationError(addMessages.validationMapsRequired);
        return;
      }
    }
    if (!dayData) return;

    const newDay = dateToDayNumber(form.date);

    const locationUpdates = form.locations.map<{ id: string; body: UpdateLocationBody }>(loc => ({
      id: loc.id,
      body: {
        name: loc.name.trim(),
        category: loc.category,
        coordinates: loc.coordinates,
        city: form.city.trim(),
        summary: loc.name.trim(),
        description: loc.name.trim(),
        address: loc.address,
        openingHours: null,
        estimatedCost: null,
        itineraryDays: [newDay],
        imageUrls: [],
        externalLinks: loc.mapsUrl
          ? [{ label: 'Google Maps', url: loc.mapsUrl }]
          : [],
      },
    }));

    const payload: UpdateItineraryPayload = {
      locationUpdates,
      oldDay: dayNumber,
      newDay,
      oldDayDate: dayData.date,
      oldDayCity: dayData.city,
      oldDayTitle: dayData.title,
      oldDayLocationIds: dayData.locationIds,
      day: {
        date: form.date,
        city: form.city.trim(),
        title: form.dayTitle.trim(),
        locationIds: form.locations.map(l => l.id),
        events: form.events
          .filter(e => e.time || e.label)
          .map(e => ({ time: e.time, label: e.label })),
      },
    };

    try {
      await update.submit(payload);
      showToast(editMessages.successToast, 'success');
      setTimeout(() => navigate('/itinerary'), REDIRECT_DELAY_MS);
    } catch (e) {
      showToast((e as Error).message ?? editMessages.errorToast, 'error');
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isDataLoading = daysLoading || locationsLoading;
  const isNotFound = isValidDay && !daysLoading && dayData === null;

  return (
    <main className="pt-20 min-h-dvh">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-semibold shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Not found */}
        {isNotFound && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <EmptyState
              title={editMessages.notFoundTitle}
              description={editMessages.notFoundDescription}
            />
            <div className="mt-6 text-center">
              <Link to="/itinerary" className="text-sm text-primary hover:underline transition-colors">
                {editMessages.backToItinerary}
              </Link>
            </div>
          </motion.div>
        )}

        {isValidDay && !isNotFound && (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold tracking-tight text-text-base"
            >
              {editMessages.pageTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-muted mt-2 mb-10"
            >
              {editMessages.pageSubtitle}
            </motion.p>

            <motion.form
              id={formId}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-8"
            >
              {/* ── Day Information ─────────────────────────────────────── */}
              <div className="rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-md border-l-4 border-accent border-white/20 shadow-xl p-6 space-y-6">
                <p className={sectionHeadingClass}>{editMessages.dayInfoLabel}</p>

                {isDataLoading ? (
                  <div className="space-y-4">
                    <SkeletonLoader className="w-full h-10" />
                    <SkeletonLoader className="w-full h-10" />
                    <SkeletonLoader className="w-2/3 h-10" />
                  </div>
                ) : (
                  <>
                    {/* Date + editing badge */}
                    <div>
                      <label htmlFor="date" className={labelClass}>
                        {addMessages.dateLabel}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          id="date"
                          type="date"
                          value={form.date}
                          min="2026-11-20"
                          onChange={e => handleDayField('date', e.target.value)}
                          className={`${inputClass} flex-1`}
                        />
                        {computedDayNumber !== null && (
                          <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-accent">
                            {editMessages.editingBadgePrefix} {computedDayNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Day title */}
                    <div>
                      <label htmlFor="day-title" className={labelClass}>
                        {addMessages.titleLabel}
                      </label>
                      <input
                        id="day-title"
                        type="text"
                        value={form.dayTitle}
                        onChange={e => handleDayField('dayTitle', e.target.value)}
                        placeholder={addMessages.titlePlaceholder}
                        className={inputClass}
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label htmlFor="city" className={labelClass}>
                        {addMessages.cityLabel}
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={form.city}
                        onChange={e => handleDayField('city', e.target.value)}
                        placeholder={addMessages.cityPlaceholder}
                        className={inputClass}
                      />
                    </div>

                    {/* Events */}
                    <div>
                      <p className={labelClass}>{addMessages.eventsLabel}</p>
                      <EventsList
                        events={form.events}
                        onAdd={handleAddEvent}
                        onRemove={handleRemoveEvent}
                        onChange={handleChangeEvent}
                        addButtonLabel={addMessages.eventsAddButton}
                        timePlaceholder={addMessages.eventsTimePlaceholder}
                        labelPlaceholder={addMessages.eventsLabelPlaceholder}
                        removeAriaLabel={addMessages.eventsRemoveAriaLabel}
                        timeAriaLabel={addMessages.eventsTimeAriaLabel}
                        descriptionAriaLabel={addMessages.eventsDescriptionAriaLabel}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* ── Locations ───────────────────────────────────────────── */}
              <div className="rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-md border-l-4 border-accent border-white/20 shadow-xl p-6 space-y-6">
                <p className={sectionHeadingClass}>{editMessages.locationsLabel}</p>

                {isDataLoading ? (
                  <div className="space-y-4">
                    <SkeletonLoader className="w-full h-10" />
                    <SkeletonLoader className="w-full h-10" />
                    <SkeletonLoader className="w-full h-10" />
                  </div>
                ) : form.locations.length === 0 ? (
                  <p className="text-muted text-sm">{editMessages.notFoundDescription}</p>
                ) : (
                  <div className="space-y-8">
                    {form.locations.map((loc, idx) => {
                      const cfg = categoryConfig[loc.category];
                      const mapsInputState =
                        loc.coordsSource === 'existing' ? 'success' : loc.extractState;
                      const mapsInputError =
                        loc.coordsSource === 'extracted' ? loc.extractError : null;

                      return (
                        <div key={loc.id}>
                          {idx > 0 && (
                            <div className="border-t border-white/10 mb-8" />
                          )}

                          {/* Location header */}
                          <div className="flex items-center gap-2 mb-4">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: cfg.colour }}
                            >
                              <cfg.Icon size={10} color="white" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                              {editMessages.locationLabel} {idx + 1}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {/* Location name */}
                            <div>
                              <label
                                htmlFor={`loc-name-${loc.id}`}
                                className={labelClass}
                              >
                                {addMessages.titleLabel}
                              </label>
                              <input
                                id={`loc-name-${loc.id}`}
                                type="text"
                                value={loc.name}
                                onChange={e =>
                                  handleLocationField(loc.id, 'name', e.target.value)
                                }
                                placeholder={addMessages.titlePlaceholder}
                                className={inputClass}
                              />
                            </div>

                            {/* Category */}
                            <div>
                              <label
                                htmlFor={`loc-category-${loc.id}`}
                                className={labelClass}
                              >
                                {addMessages.categoryLabel}
                              </label>
                              <select
                                id={`loc-category-${loc.id}`}
                                value={loc.category}
                                onChange={e =>
                                  handleLocationField(
                                    loc.id,
                                    'category',
                                    e.target.value as LocationCategory,
                                  )
                                }
                                className={inputClass}
                              >
                                {CATEGORY_OPTIONS.map(cat => (
                                  <option key={cat} value={cat}>
                                    {categoryConfig[cat].label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Maps URL */}
                            <MapsUrlInput
                              value={loc.mapsUrl}
                              onChange={url =>
                                handleLocationMapsUrlChange(loc.id, url)
                              }
                              onExtract={url =>
                                handleExtractForLocation(loc.id, url)
                              }
                              state={mapsInputState}
                              error={mapsInputError}
                              label={addMessages.mapsUrlLabel}
                              placeholder={addMessages.mapsUrlPlaceholder}
                              hint={addMessages.mapsUrlHint}
                            />

                            {/* Coordinates confirmation */}
                            {(loc.coordsSource === 'existing' ||
                              loc.extractState === 'success') && (
                              <p className="text-xs text-muted font-mono">
                                {loc.coordinates.lat.toFixed(6)},{' '}
                                {loc.coordinates.lng.toFixed(6)}
                                {loc.address && (
                                  <span className="not-italic font-sans ml-2 normal-case">
                                    · {loc.address}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Validation error */}
              {validationError && (
                <p role="alert" className="text-red-500 text-sm">
                  {validationError}
                </p>
              )}

              {/* Submit */}
              {!isDataLoading && (
                <button
                  type="submit"
                  disabled={update.isLoading}
                  className="w-full py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
                >
                  {update.isLoading ? editMessages.submitting : editMessages.submitButton}
                </button>
              )}
            </motion.form>
          </>
        )}
      </div>
    </main>
  );
}
