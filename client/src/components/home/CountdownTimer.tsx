import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrip } from '../../hooks/useTrip';
import { homeMessages } from '../../messages/home.messages';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(departureDate: string): TimeLeft | null {
  const diff = new Date(departureDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-surface flex items-center justify-center shadow-lg relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-text-base text-3xl md:text-4xl font-bold tabular-nums absolute"
          >
            {String(value).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-muted text-xs font-medium mt-2 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function CountdownTimer() {
  const { data: trip } = useTrip();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [departed, setDeparted] = useState(false);

  useEffect(() => {
    if (!trip?.departureDate) return;
    const update = () => {
      const tl = getTimeLeft(trip.departureDate);
      if (!tl) {
        setDeparted(true);
        setTimeLeft(null);
      } else {
        setTimeLeft(tl);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [trip?.departureDate]);

  if (!trip) return null;

  return (
    <section className="py-20 px-6 bg-surface">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-text-base text-3xl font-bold mb-10">
          {homeMessages.countdownTitle}
        </h2>
        {departed ? (
          <p className="text-accent text-4xl font-bold">{homeMessages.countdownDeparted}</p>
        ) : timeLeft ? (
          <div className="flex justify-center gap-4 md:gap-6">
            <TimeUnit value={timeLeft.days} label={homeMessages.countdownDays} />
            <TimeUnit value={timeLeft.hours} label={homeMessages.countdownHours} />
            <TimeUnit value={timeLeft.minutes} label={homeMessages.countdownMinutes} />
            <TimeUnit value={timeLeft.seconds} label={homeMessages.countdownSeconds} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
