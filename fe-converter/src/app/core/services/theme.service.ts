import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  theme = signal<Theme>('dark');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('dc-theme') as Theme | null;
      const preferred =
        saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      this.setTheme(preferred);
    }
  }

  toggle() {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private setTheme(t: Theme) {
    this.theme.set(t);
    if (isPlatformBrowser(this.platformId)) {
      const root = document.documentElement;
      if (t === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
      localStorage.setItem('dc-theme', t);
    }
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }
}
