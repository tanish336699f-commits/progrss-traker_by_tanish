import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db } from './db';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    (async () => {
      const settings = await db.settings.toCollection().first();
      if (settings) setTheme(settings.theme);
    })();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    (async () => {
      const settings = await db.settings.toCollection().first();
      if (settings) {
        await db.settings.update(settings.id!, { theme });
      } else {
        await db.settings.add({ theme });
      }
    })();
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
