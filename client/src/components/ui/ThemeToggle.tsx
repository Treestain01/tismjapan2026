import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/theme.store';
import { commonMessages } from '../../messages/common.messages';

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? commonMessages.themeToggleLight : commonMessages.themeToggleDark}
      className="p-2 rounded-lg text-muted hover:text-text-base hover:bg-surface transition-colors duration-150 cursor-pointer"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
