import { bgcolor } from '@save-app/models';

export type MobileSection = 'collections' | 'cards' | 'search' | 'analytics' | 'settings';

export interface MobileNavItem {
  id: MobileSection;
  label: string;
  icon: string;
}

export interface MobileThemeOption {
  id: bgcolor;
  label: string;
}

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { id: 'collections', label: 'Collections', icon: 'icons/data-collection.png' },
  { id: 'cards', label: 'Cards', icon: 'icons/flash-card.png' },
  { id: 'search', label: 'Search', icon: 'icons/ai-search.png' },
  { id: 'analytics', label: 'Analytics', icon: 'icons/data-analytics.png' },
  { id: 'settings', label: 'Settings', icon: 'icons/gear.png' },
];

export const MOBILE_THEME_OPTIONS: MobileThemeOption[] = [
  { id: 'system', label: 'System' },
  { id: 'elemental', label: 'Elemental' },
  { id: 'elemental-dark', label: 'Elemental Dark' },
  { id: 'electric-violet', label: 'Electric Violet' },
  { id: 'juicy-orange', label: 'Juicy Orange' },
  { id: 'mojito', label: 'Mojito' },
  { id: 'cherry', label: 'Cherry' },
  { id: 'modern-bg', label: 'Modern' },
];
