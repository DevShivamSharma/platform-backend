import { createContext, useContext, useEffect, useState } from 'react';
import { templateConfig } from '../../config.js';

const ThemeContext = createContext(null);

const cssVarName = (key) => `--${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`;
const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const getInitialTheme = () => {
  if (typeof window === 'undefined') return templateConfig.theme.defaultTheme;
  const stored = localStorage.getItem(templateConfig.theme.storageKey);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

function applyThemeVars(theme) {
  const root = document.documentElement;
  const themeConfig = asObject(templateConfig.theme);
  const modes = asObject(themeConfig.modes);
  const palette = asObject(modes[theme] || modes.dark);
  const fonts = asObject(themeConfig.fonts);

  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;

  Object.entries(fonts).forEach(([key, value]) => {
    root.style.setProperty(`--font-${key}`, value);
  });

  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(cssVarName(key), value);
  });
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyThemeVars(theme);
    localStorage.setItem(templateConfig.theme.storageKey, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
