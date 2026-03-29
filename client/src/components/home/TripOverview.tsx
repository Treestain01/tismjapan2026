import { useTrip } from '../../hooks/useTrip';
import { homeMessages } from '../../messages/home.messages';

export function TripOverview() {
  const { data: trip } = useTrip();

  const stats = [
    { label: homeMessages.overviewLabel, value: homeMessages.overviewDestination },
    { label: homeMessages.durationLabel, value: homeMessages.durationValue },
    { label: homeMessages.citiesLabel, value: trip?.cities.join(', ') ?? '\u2014' },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-text-base text-3xl font-bold mb-3">{homeMessages.overviewTitle}</h2>
        {trip && (
          <p className="text-muted text-base leading-relaxed mb-10 max-w-2xl">
            {trip.description}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="p-6 rounded-2xl bg-surface border border-bg backdrop-blur-sm"
            >
              <p className="text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p className="text-text-base text-lg font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
