import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';

interface EventItem {
  id: string;
  time: string;
  label: string;
}

interface EventsListProps {
  events: EventItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: 'time' | 'label', value: string) => void;
  addButtonLabel: string;
  timePlaceholder: string;
  labelPlaceholder: string;
  removeAriaLabel: string;
  timeAriaLabel: string;
  descriptionAriaLabel: string;
}

export function EventsList({
  events,
  onAdd,
  onRemove,
  onChange,
  addButtonLabel,
  timePlaceholder,
  labelPlaceholder,
  removeAriaLabel,
  timeAriaLabel,
  descriptionAriaLabel,
}: EventsListProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {events.map(event => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={event.time}
              onChange={e => onChange(event.id, 'time', e.target.value)}
              placeholder={timePlaceholder}
              aria-label={timeAriaLabel}
              className="w-24 flex-shrink-0 bg-surface border border-bg rounded-lg px-3 py-2 text-sm text-text-base placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <input
              type="text"
              value={event.label}
              onChange={e => onChange(event.id, 'label', e.target.value)}
              placeholder={labelPlaceholder}
              aria-label={descriptionAriaLabel}
              className="flex-1 bg-surface border border-bg rounded-lg px-3 py-2 text-sm text-text-base placeholder:text-muted outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              type="button"
              onClick={() => onRemove(event.id)}
              aria-label={removeAriaLabel}
              className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0 cursor-pointer"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onAdd}
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-text-base transition-colors cursor-pointer py-1"
      >
        <motion.span whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
          <Plus size={16} />
        </motion.span>
        {addButtonLabel}
      </motion.button>
    </div>
  );
}
