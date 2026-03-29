import { HeroSection } from '../components/home/HeroSection';
import { TripOverview } from '../components/home/TripOverview';
import { CountdownTimer } from '../components/home/CountdownTimer';

export function HomePage() {
  return (
    <main>
      <HeroSection />
      <TripOverview />
      <CountdownTimer />
    </main>
  );
}
