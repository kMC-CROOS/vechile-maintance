import React, { createContext, useContext, useEffect, useState } from 'react';
import { LightThemeColors, DarkThemeColors, ThemeColors } from '@/constants/theme';
import { getSetting, setSetting } from '@/services/storage';

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (dark: boolean) => Promise<void>;
}

const THEME_STORAGE_KEY = 'app_dark_mode';

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: LightThemeColors,
  toggleTheme: () => {},
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getSetting(THEME_STORAGE_KEY, 'false');
        setIsDark(stored === 'true');
      } catch (err) {
        console.error('Failed to load theme preference', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setThemeMode = async (dark: boolean) => {
    setIsDark(dark);
    try {
      await setSetting(THEME_STORAGE_KEY, String(dark));
    } catch (err) {
      console.error('Failed to persist theme preference', err);
    }
  };

  const toggleTheme = () => {
    setThemeMode(!isDark);
  };

  const theme = isDark ? DarkThemeColors : LightThemeColors;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
