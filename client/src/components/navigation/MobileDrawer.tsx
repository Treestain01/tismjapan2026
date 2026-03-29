import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { commonMessages } from '../../messages/common.messages';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  links: { to: string; label: string }[];
}

export function MobileDrawer({ open, onClose, links }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-surface shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-bg">
              <span className="font-semibold text-text-base">{commonMessages.appTitle}</span>
              <button
                onClick={onClose}
                aria-label={commonMessages.close}
                className="p-2 rounded-lg text-muted hover:text-text-base transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-4">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                      isActive ? 'text-accent bg-bg' : 'text-muted hover:text-text-base hover:bg-bg'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
