import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
export type ColorTheme = 'teal' | 'blue' | 'purple' | 'rose' | 'orange' | 'green';
export type FontSize = 'small' | 'medium' | 'large';
export type BorderRadius = 'sharp' | 'default' | 'rounded' | 'pill';
export type Density = 'compact' | 'default' | 'comfortable';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colorTheme: ColorTheme;
  setColorTheme: (c: ColorTheme) => void;
  fontSize: FontSize;
  setFontSize: (f: FontSize) => void;
  borderRadius: BorderRadius;
  setBorderRadius: (r: BorderRadius) => void;
  density: Density;
  setDensity: (d: Density) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const COLOR_THEMES: Record<ColorTheme, { light: { primary: string; ring: string; sidebarPrimary: string; sidebarRing: string }; dark: { primary: string; ring: string; sidebarPrimary: string; sidebarRing: string }; preview: string }> = {
  teal: {
    light: { primary: '170 65% 36%', ring: '170 65% 36%', sidebarPrimary: '170 65% 48%', sidebarRing: '170 65% 48%' },
    dark: { primary: '170 65% 48%', ring: '170 65% 48%', sidebarPrimary: '170 65% 48%', sidebarRing: '170 65% 48%' },
    preview: 'hsl(170, 65%, 42%)',
  },
  blue: {
    light: { primary: '217 91% 50%', ring: '217 91% 50%', sidebarPrimary: '217 91% 55%', sidebarRing: '217 91% 55%' },
    dark: { primary: '217 91% 60%', ring: '217 91% 60%', sidebarPrimary: '217 91% 60%', sidebarRing: '217 91% 60%' },
    preview: 'hsl(217, 91%, 50%)',
  },
  purple: {
    light: { primary: '262 83% 55%', ring: '262 83% 55%', sidebarPrimary: '262 83% 58%', sidebarRing: '262 83% 58%' },
    dark: { primary: '262 83% 65%', ring: '262 83% 65%', sidebarPrimary: '262 83% 65%', sidebarRing: '262 83% 65%' },
    preview: 'hsl(262, 83%, 55%)',
  },
  rose: {
    light: { primary: '346 77% 50%', ring: '346 77% 50%', sidebarPrimary: '346 77% 55%', sidebarRing: '346 77% 55%' },
    dark: { primary: '346 77% 60%', ring: '346 77% 60%', sidebarPrimary: '346 77% 60%', sidebarRing: '346 77% 60%' },
    preview: 'hsl(346, 77%, 50%)',
  },
  orange: {
    light: { primary: '25 95% 50%', ring: '25 95% 50%', sidebarPrimary: '25 95% 55%', sidebarRing: '25 95% 55%' },
    dark: { primary: '25 95% 58%', ring: '25 95% 58%', sidebarPrimary: '25 95% 58%', sidebarRing: '25 95% 58%' },
    preview: 'hsl(25, 95%, 50%)',
  },
  green: {
    light: { primary: '142 60% 35%', ring: '142 60% 35%', sidebarPrimary: '142 60% 42%', sidebarRing: '142 60% 42%' },
    dark: { primary: '142 60% 48%', ring: '142 60% 48%', sidebarPrimary: '142 60% 48%', sidebarRing: '142 60% 48%' },
    preview: 'hsl(142, 60%, 38%)',
  },
};

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

const BORDER_RADIUS_MAP: Record<BorderRadius, string> = {
  sharp:   '0px',
  default: '0.5rem',
  rounded: '0.75rem',
  pill:    '1.25rem',
};

export { COLOR_THEMES };

function applyColorTheme(colorTheme: ColorTheme, isDark: boolean) {
  const root = document.documentElement;
  const mode = isDark ? 'dark' : 'light';
  const vars = COLOR_THEMES[colorTheme][mode];
  root.style.setProperty('--primary', vars.primary);
  root.style.setProperty('--ring', vars.ring);
  root.style.setProperty('--sidebar-primary', vars.sidebarPrimary);
  root.style.setProperty('--sidebar-ring', vars.sidebarRing);
}

function applyFontSize(fontSize: FontSize) {
  document.documentElement.style.fontSize = FONT_SIZE_MAP[fontSize];
}

function applyBorderRadius(radius: BorderRadius) {
  document.documentElement.style.setProperty('--radius', BORDER_RADIUS_MAP[radius]);
}

function applyDensity(density: Density) {
  document.documentElement.setAttribute('data-density', density);
}

function applyReduceMotion(reduce: boolean) {
  document.documentElement.classList.toggle('reduce-motion', reduce);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('pos_theme');
    return (stored === 'dark' || stored === 'light') ? stored : 'light';
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window === 'undefined') return 'teal';
    const stored = localStorage.getItem('pos_color_theme');
    return (stored && stored in COLOR_THEMES) ? stored as ColorTheme : 'teal';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    if (typeof window === 'undefined') return 'medium';
    const stored = localStorage.getItem('pos_font_size');
    return (stored === 'small' || stored === 'medium' || stored === 'large') ? stored : 'medium';
  });

  const [borderRadius, setBorderRadiusState] = useState<BorderRadius>(() => {
    if (typeof window === 'undefined') return 'rounded';
    const stored = localStorage.getItem('pos_border_radius');
    return (['sharp', 'default', 'rounded', 'pill'] as BorderRadius[]).includes(stored as BorderRadius)
      ? stored as BorderRadius : 'rounded';
  });

  const [density, setDensityState] = useState<Density>(() => {
    if (typeof window === 'undefined') return 'default';
    const stored = localStorage.getItem('pos_density');
    return (['compact', 'default', 'comfortable'] as Density[]).includes(stored as Density)
      ? stored as Density : 'default';
  });

  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('pos_reduce_motion') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('pos_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    applyColorTheme(colorTheme, theme === 'dark');
  }, [theme, colorTheme]);

  useEffect(() => {
    localStorage.setItem('pos_color_theme', colorTheme);
    applyColorTheme(colorTheme, theme === 'dark');
  }, [colorTheme, theme]);

  useEffect(() => {
    localStorage.setItem('pos_font_size', fontSize);
    applyFontSize(fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('pos_border_radius', borderRadius);
    applyBorderRadius(borderRadius);
  }, [borderRadius]);

  useEffect(() => {
    localStorage.setItem('pos_density', density);
    applyDensity(density);
  }, [density]);

  useEffect(() => {
    localStorage.setItem('pos_reduce_motion', String(reduceMotion));
    applyReduceMotion(reduceMotion);
  }, [reduceMotion]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const setColorTheme = (c: ColorTheme) => setColorThemeState(c);
  const setFontSize = (f: FontSize) => setFontSizeState(f);
  const setBorderRadius = (r: BorderRadius) => setBorderRadiusState(r);
  const setDensity = (d: Density) => setDensityState(d);
  const setReduceMotion = (v: boolean) => setReduceMotionState(v);

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme,
      colorTheme, setColorTheme,
      fontSize, setFontSize,
      borderRadius, setBorderRadius,
      density, setDensity,
      reduceMotion, setReduceMotion,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
