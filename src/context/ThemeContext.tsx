import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, AppSettings, ThemeDefinition } from '../types/theme';

export const THEMES: ThemeDefinition[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Gold (Koyu Sarraf)',
    category: 'dark',
    description: 'Kapalıçarşı borsa ekranı, koyu antrasit zemin ve altın sarısı vurgular.',
    previewColors: {
      bg: '#080c14',
      card: '#0f172a',
      accent: '#f59e0b',
      text: '#f8fafc',
    },
  },
  {
    id: 'light-sarraf',
    name: 'Gündüz / Klasik Sarraf (Krem & Altın)',
    category: 'light',
    description: 'Aydınlık kuyumcu dükkanı, sıcak krem kağıt zemin ve koyu kontrast rakamlar.',
    previewColors: {
      bg: '#f8f6f0',
      card: '#ffffff',
      accent: '#b45309',
      text: '#1c1917',
    },
  },
  {
    id: 'light-clean',
    name: 'Borsa Açık (Modern Gündüz)',
    category: 'light',
    description: 'Temiz beyaz ve açık gri finans masası, net okunabilir banka terminali.',
    previewColors: {
      bg: '#f1f5f9',
      card: '#ffffff',
      accent: '#d97706',
      text: '#0f172a',
    },
  },
  {
    id: 'emerald',
    name: 'Kapalıçarşı Zümrüt (Derin Yeşil)',
    category: 'dark',
    description: 'Geleneksel sarrafiye, derin koyu zümrüt zemin ve parlak altın detaylar.',
    previewColors: {
      bg: '#04130d',
      card: '#082117',
      accent: '#f59e0b',
      text: '#f0fdf4',
    },
  },
  {
    id: 'midnight',
    name: 'Gece Mavisi (Derin Okyanus)',
    category: 'dark',
    description: 'Derin lacivert gece modu, göz yormayan profesyonel borsa arayüzü.',
    previewColors: {
      bg: '#070e1e',
      card: '#0d1b38',
      accent: '#f59e0b',
      text: '#f8fafc',
    },
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light-sarraf',
  soundAlerts: false,
  priceFlashAnimations: true,
  autoRefreshInterval: 1600,
  defaultView: 'market',
};

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  isDark: boolean;
  toggleDayNight: () => void;
  playAlertSound: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('samsun_sarraf_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const activeTheme = THEMES.find((t) => t.id === settings.theme) || THEMES[0];
  const isDark = activeTheme.category === 'dark';

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme, isDark]);

  // Persist settings
  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem('samsun_sarraf_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setTheme = (t: ThemeId) => {
    updateSettings({ theme: t });
  };

  const toggleDayNight = () => {
    if (isDark) {
      // Switch to Day / Light mode
      updateSettings({ theme: 'light-clean' });
    } else {
      // Switch to Night / Dark mode
      updateSettings({ theme: 'obsidian' });
    }
  };

  // Play gentle alert tone via Web Audio API
  const playAlertSound = () => {
    if (!settings.soundAlerts) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: settings.theme,
        setTheme,
        settings,
        updateSettings,
        isDark,
        toggleDayNight,
        playAlertSound,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
