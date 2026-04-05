import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/navigation/Navbar';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { ItineraryPage } from './pages/ItineraryPage';
import { GalleryPage } from './pages/GalleryPage';
import { BudgetPage } from './pages/BudgetPage';
import { AddItineraryPage } from './pages/AddItineraryPage';
import { EditItineraryPage } from './pages/EditItineraryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/itinerary" element={<ItineraryPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/add" element={<AddItineraryPage />} />
        <Route path="/edit/:day" element={<EditItineraryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
