export type ThemeId = 'obsidian' | 'light-sarraf' | 'light-clean' | 'emerald' | 'midnight';

export type GlobalDisplayMode = 'store_custom' | 'standard_table';

export type StandardThemeId =
  | 'light_clarity'
  | 'dark_gold'
  | 'midnight_navy'
  | 'emerald_sarraf'
  | 'digital_led'
  | 'warm_cream';

export type FontScaleMode = 'normal' | 'large' | 'xlarge';

export interface StandardThemeDefinition {
  id: StandardThemeId;
  name: string;
  category: 'light' | 'dark';
  badge: string;
  description: string;
  bgPreview: string;
  textPreview: string;
  accentPreview: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  category: 'dark' | 'light';
  description: string;
  previewColors: {
    bg: string;
    card: string;
    accent: string;
    text: string;
  };
}

export interface AppSettings {
  theme: ThemeId;
  soundAlerts: boolean;
  priceFlashAnimations: boolean;
  autoRefreshInterval: number; // in milliseconds, 0 means paused
  defaultView: 'market' | 'matrix';
}
