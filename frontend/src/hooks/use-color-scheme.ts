import { useAppTheme } from '@/context/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  try {
    const { isDark } = useAppTheme();
    return isDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
