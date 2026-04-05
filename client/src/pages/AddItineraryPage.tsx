import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useExtractLocation } from '../hooks/useExtractLocation';
import { useCreateItinerary } from '../hooks/useCreateItinerary';
import { useTrip } from '../hooks/useTrip';
import { MapsUrlInput } from '../components/add/MapsUrlInput';
import { EventsList } from '../components/add/EventsList';
import { ExtractedLocationCard } from '../components/add/ExtractedLocationCard';
import { categoryConfig } from '../utils/categoryConfig';
import { addMessages } from '../messages/add.messages';
import type { LocationCategory, AddItineraryPayload } from '../types';

const DEPARTURE = new Date('2026-11-20');

function dateToDayNumber(dateStr: string): number {
  const d = new Date(dateStr);
  const diff = Math.floor((d.getTime() - DEPARTURE.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

interface FormState {
  date: string;
  title: string;
  city: string;
  category: LocationCategory;
  mapsUrl: string;
  events: { id: string; time: string; label: string }[];
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

export function AddItineraryPage() {
  const navigate = useNavigate();
  const formId = useId();

  const [form, setForm] = useState<FormState>({
    date: '',
    title: '',
    city: '',
    category: 'attraction',
    mapsUrl: '',
    events: [],
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const extraction = useExtractLocation();
  const creation = useCreateItinerary();
  const { data: tripData } = useTrip();

  const existingCities = tripData?.cities ?? [];
  const dayNumber = form.date ? dateToDayNumber(form.date) : null;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFieldChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!form.date) {
      setValidationError(addMessages.validationDateRequired);
      return;
    }
    if (!form.title.trim()) {
      setValidationError(addMessages.validationTitleRequired);
      return;
    }
    if (!form.city.trim()) {
      setValidationError(addMessages.validationCityRequired);
      return;
    }
    if (extraction.state !== 'success' || !extraction.data) {
      setValidationError(addMessages.validationMapsRequired);
      return;
    }

    const day = dateToDayNumber(form.date);
    const locationId = crypto.randomUUID();

    const payload: AddItineraryPayload = {
      location: {
        id: locationId,
        name: form.title.trim(),
        category: form.category,
        coordinates: extraction.data.coordinates,
        city: form.city.trim(),
        summary: form.title.trim(),
        description: form.title.trim(),
        address: extraction.data.address,
        openingHours: null,
        estimatedCost: null,
        itineraryDays: [day],
        imageUrls: [],
        externalLinks: [{ label: 'Google Maps', url: form.mapsUrl }],
      },
      day: {
        day,
        date: form.date,
        city: form.city.trim(),
        title: form.title.trim(),
        locationIds: [locationId],
        events: form.events
          .filter(e => e.time || e.label)
          .map(e => ({ time: e.time, label: e.label })),
      },
    };

    try {
      await creation.submit(payload);
      showToast(addMessages.successToast, 'success');
      setTimeout(() => navigate('/itinerary'), REDIRECT_DELAY_MS);
    } catch (e) {
      showToast((e as Error).message ?? addMessages.errorToast, 'error');
    }
  };

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
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold tracking-tight text-text-base"
        >
          {addMessages.pageTitle}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-muted mt-2 mb-10"
        >
          {addMessages.pageSubtitle}
        </motion.p>

        <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Form */}
          <motion.form
            id={formId}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-6 rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 shadow-xl p-6"
          >
            {/* Date + day badge */}
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
                  onChange={e => handleFieldChange('date', e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                {dayNumber !== null && (
                  <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-primary">
                    {addMessages.dayBadgePrefix} {dayNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className={labelClass}>
                {addMessages.titleLabel}
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={e => handleFieldChange('title', e.target.value)}
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
                onChange={e => handleFieldChange('city', e.target.value)}
                placeholder={addMessages.cityPlaceholder}
                className={inputClass}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className={labelClass}>
                {addMessages.categoryLabel}
              </label>
              <select
                id="category"
                value={form.category}
                onChange={e => handleFieldChange('category', e.target.value as LocationCategory)}
                className={inputClass}
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>
                    {categoryConfig[cat].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Google Maps URL */}
            <MapsUrlInput
              value={form.mapsUrl}
              onChange={val => handleFieldChange('mapsUrl', val)}
              onExtract={extraction.extract}
              state={extraction.state}
              error={extraction.error}
              label={addMessages.mapsUrlLabel}
              placeholder={addMessages.mapsUrlPlaceholder}
              hint={addMessages.mapsUrlHint}
            />

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

            {/* Validation error */}
            {validationError && (
              <p role="alert" className="text-red-500 text-sm">{validationError}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={creation.isLoading}
              className="w-full py-3 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
            >
              {creation.isLoading ? addMessages.submitting : addMessages.submitButton}
            </button>
          </motion.form>

          {/* Preview — desktop */}
          <aside className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <ExtractedLocationCard
                state={extraction.state}
                data={extraction.data}
                existingCities={existingCities}
                title={addMessages.previewTitle}
                noDataText={addMessages.previewNoData}
                newCityText={addMessages.previewNewCity}
                existingCityText={addMessages.previewExistingCity}
              />
            </motion.div>
          </aside>

          {/* Preview — mobile (below form, only when successful) */}
          <AnimatePresence>
            {extraction.state === 'success' && (
              <motion.div
                key="mobile-preview"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden mt-6 overflow-hidden"
              >
                <ExtractedLocationCard
                  state={extraction.state}
                  data={extraction.data}
                  existingCities={existingCities}
                  title={addMessages.previewTitle}
                  noDataText={addMessages.previewNoData}
                  newCityText={addMessages.previewNewCity}
                  existingCityText={addMessages.previewExistingCity}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
