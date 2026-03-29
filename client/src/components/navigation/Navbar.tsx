import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { MobileDrawer } from './MobileDrawer';
import { commonMessages } from '../../messages/common.messages';

const navLinks = [
  { to: '/', label: commonMessages.navHome },
  { to: '/map', label: commonMessages.navMap },
  { to: '/itinerary', label: commonMessages.navItinerary },
  { to: '/gallery', label: commonMessages.navGallery },
  { to: '/budget', label: commonMessages.navBudget },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'backdrop-blur-md bg-bg/80 border-b border-surface/50 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Wordmark */}
            <NavLink to="/" className="text-text-base font-semibold text-lg tracking-tight">
              {commonMessages.appTitle}
            </NavLink>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? 'text-accent border-b-2 border-accent pb-1.5'
                        : 'text-muted hover:text-text-base'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <ThemeToggle />
            </div>

            {/* Mobile hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label={commonMessages.openNavMenu}
                className="p-2 rounded-lg text-muted hover:text-text-base transition-colors cursor-pointer"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} links={navLinks} />
    </>
  );
}
