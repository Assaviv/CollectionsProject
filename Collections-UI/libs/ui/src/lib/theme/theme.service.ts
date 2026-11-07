import { Injectable, signal } from '@angular/core';
import { bgcolor } from '@save-app/models';

const THEME_STORAGE_KEY = 'collections-ui-theme';
const THEMES: bgcolor[] = [
  'electric-violet',
  'juicy-orange',
  'mojito',
  'cherry',
  'modern-bg',
  'dark-mode',
];

function isTheme(value: string | null): value is bgcolor {
  return value !== null && THEMES.includes(value as bgcolor);
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  bgcolor = signal<bgcolor>(this.loadTheme());

  set setBgcolor(color: bgcolor) {
    this.bgcolor.set(color);
    this.saveTheme(color);
  }

  private loadTheme(): bgcolor {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      return isTheme(savedTheme) ? savedTheme : 'modern-bg';
    } catch {
      return 'modern-bg';
    }
  }

  private saveTheme(color: bgcolor): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, color);
    } catch {
      // Keep the in-memory theme working when browser storage is unavailable.
    }
  }
}
