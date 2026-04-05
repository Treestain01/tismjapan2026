import { useRef, useEffect } from 'react';
import { Link, Loader2, Check, X } from 'lucide-react';

interface MapsUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onExtract: (url: string) => void;
  state: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  label: string;
  placeholder: string;
  hint: string;
}

const borderClass: Record<MapsUrlInputProps['state'], string> = {
  idle: 'border border-bg focus-within:ring-2 focus-within:ring-primary/50',
  loading: 'ring-2 ring-amber-400 animate-pulse',
  success: 'ring-2 ring-emerald-500',
  error: 'ring-2 ring-red-500',
};

const StateIcon = ({ state }: { state: MapsUrlInputProps['state'] }) => {
  switch (state) {
    case 'loading':
      return <Loader2 size={16} className="animate-spin text-amber-400" />;
    case 'success':
      return <Check size={16} className="text-emerald-500" />;
    case 'error':
      return <X size={16} className="text-red-500" />;
    default:
      return <Link size={16} className="text-muted" />;
  }
};

export function MapsUrlInput({
  value,
  onChange,
  onExtract,
  state,
  error,
  label,
  placeholder,
  hint,
}: MapsUrlInputProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const MAPS_URL_PATTERN = /^https?:\/\/(maps\.google\.com|www\.google\.com\/maps|goo\.gl|maps\.app\.goo\.gl)/i;

  const triggerExtract = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (MAPS_URL_PATTERN.test(val)) {
      debounceRef.current = setTimeout(() => {
        onExtract(val);
      }, 400);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    triggerExtract(val);
  };

  const describedBy = ['maps-url-hint', error ? 'maps-url-error' : ''].filter(Boolean).join(' ');

  return (
    <div className="space-y-1.5">
      <label htmlFor="maps-url" className="block text-sm font-medium text-text-base">
        {label}
      </label>
      <div className={`relative rounded-lg bg-surface transition-all duration-200 ${borderClass[state]}`}>
        <input
          id="maps-url"
          type="url"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-describedby={describedBy}
          className="w-full bg-transparent px-3 py-2.5 pr-10 text-sm text-text-base placeholder:text-muted outline-none rounded-lg"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <StateIcon state={state} />
        </span>
      </div>
      <p id="maps-url-hint" className="text-xs text-muted">
        {hint}
      </p>
      {error && (
        <p id="maps-url-error" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
