import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LightColors, DarkColors, ThemeColors } from '../theme';

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'habitflow_user_theme';

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: LightColors,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');

  useEffect(() => {
    // Load stored user theme preference
    SecureStore.getItemAsync(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved !== null) {
          setIsDark(saved === 'dark');
        } else {
          setIsDark(systemScheme === 'dark');
        }
      })
      .catch(() => {});
  }, [systemScheme]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      SecureStore.setItemAsync(THEME_STORAGE_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  };

  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

