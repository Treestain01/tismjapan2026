import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  theme: 'dark' | 'light';
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    { name: 'tism-theme' }
  )
);

// Apply theme on initial load
const storedTheme = localStorage.getItem('tism-theme');
if (storedTheme) {
  try {
    const parsed = JSON.parse(storedTheme);
    if (parsed?.state?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch {
    // ignore parse errors
  }
} else {
  document.documentElement.classList.add('dark'); // default dark
}
