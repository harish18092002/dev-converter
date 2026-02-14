import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header
      class="fixed top-0 left-0 w-full z-50 transition-all duration-700"
      [style.background]="isScrolled() ? headerBg() : 'transparent'"
      [style.backdrop-filter]="isScrolled() ? 'blur(20px) saturate(180%)' : 'none'"
      [style.border-bottom]="isScrolled() ? '1px solid var(--border-subtle)' : 'none'"
      [style.box-shadow]="
        isScrolled()
          ? themeSvc.isDark()
            ? '0 4px 30px rgba(0,0,0,0.4)'
            : '0 4px 30px rgba(0,0,0,0.06)'
          : 'none'
      "
    >
      <div class="container mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-3 group">
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
            style="background: linear-gradient(135deg, #7c3aed, #f59e0b);"
          >
            DC
          </div>
          <span class="text-lg font-bold gradient-text hidden sm:block tracking-tight"
            >DevConverter</span
          >
        </a>

        <!-- Desktop Nav -->
        <nav class="hidden lg:flex items-center gap-0.5">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active-link"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              class="nav-link"
              >{{ item.label }}</a
            >
          }
        </nav>

        <!-- Right Actions -->
        <div class="flex items-center gap-3">
          <!-- Theme Toggle -->
          <button
            (click)="toggleTheme()"
            class="theme-toggle"
            [attr.aria-label]="themeSvc.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <div class="theme-toggle-knob" [class.spinning]="isAnimating()">
              @if (themeSvc.isDark()) {
                <span>🌙</span>
              } @else {
                <span>☀️</span>
              }
            </div>
          </button>

          <!-- Mobile Menu -->
          <button (click)="toggleMenu()" class="lg:hidden btn-icon" aria-label="Toggle menu">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              @if (menuOpen()) {
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              } @else {
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              }
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (menuOpen()) {
        <div
          class="lg:hidden border-t"
          style="background:var(--header-mobile-bg); backdrop-filter:blur(24px); border-color:var(--border-subtle)"
        >
          <nav class="container mx-auto px-6 py-3 flex flex-col gap-0.5">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                (click)="menuOpen.set(false)"
                routerLinkActive="active-link"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                class="mobile-nav-link"
                >{{ item.label }}</a
              >
            }
          </nav>
        </div>
      }
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .nav-link {
        padding: 6px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-secondary);
        transition: all 0.3s;
      }
      .nav-link:hover {
        color: var(--text-primary);
        background: var(--tab-hover-bg);
      }
      .active-link {
        color: var(--text-primary) !important;
        background: rgba(139, 92, 246, 0.1) !important;
      }
      .mobile-nav-link {
        padding: 10px 16px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary);
        transition: all 0.3s;
      }
      .mobile-nav-link:hover {
        color: var(--text-primary);
        background: var(--tab-hover-bg);
      }
      .spinning {
        animation: theme-spin 0.5s ease-in-out;
      }
      @keyframes theme-spin {
        0% {
          transform: rotate(0deg) scale(1);
        }
        50% {
          transform: rotate(180deg) scale(0.7);
        }
        100% {
          transform: rotate(360deg) scale(1);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'onScroll()' },
})
export class HeaderComponent {
  private pid = inject(PLATFORM_ID);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  themeSvc = inject(ThemeService);
  isScrolled = signal(false);
  menuOpen = signal(false);
  isAnimating = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
        this.cdr.markForCheck();
      });
  }

  navItems = [
    { label: 'Home', path: '/', exact: true },
    { label: 'JSON / XML', path: '/json', exact: false },
    { label: 'Encoders', path: '/base64', exact: false },
    { label: 'Database', path: '/db', exact: false },
    { label: 'Date & Time', path: '/date', exact: false },
    { label: 'API Converter', path: '/curl', exact: false },
    { label: 'Text Utilities', path: '/utils', exact: false },
  ];

  headerBg() {
    return this.themeSvc.isDark() ? 'rgba(6,9,18,0.88)' : 'rgba(253,251,245,0.92)';
  }

  onScroll() {
    if (isPlatformBrowser(this.pid)) this.isScrolled.set(window.scrollY > 10);
  }
  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  toggleTheme() {
    this.isAnimating.set(true);
    this.themeSvc.toggle();
    setTimeout(() => this.isAnimating.set(false), 500);
  }
}
