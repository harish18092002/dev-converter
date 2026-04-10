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

interface NavItem { label: string; path: string; icon: string; desc: string }
interface NavGroup { label: string; emoji: string; items: NavItem[] }

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header
      class="fixed top-0 left-0 w-full z-50 transition-all duration-500"
      [class.scrolled]="isScrolled()"
    >
      <div class="h-16 flex items-center gap-4 px-5 lg:px-8 max-w-[1400px] mx-auto">

        <!-- Logo -->
        <a routerLink="/" class="logo flex items-center gap-2.5 flex-shrink-0 mr-2">
          <div class="logo-mark w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-[11px]">DC</div>
          <span class="text-[15px] font-bold gradient-text hidden sm:block tracking-tight">DevConverter</span>
        </a>

        <!-- Desktop nav -->
        <nav class="hidden lg:flex items-center gap-0.5 flex-1" (mouseleave)="closeGroup()">
          <a
            routerLink="/"
            routerLinkActive="nav-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-pill"
          >Home</a>

          @for (g of navGroups; track g.label) {
            <div class="group-wrap relative" (mouseenter)="openGroup(g.label)">
              <button
                class="nav-pill flex items-center gap-1"
                [class.nav-active]="isGroupActive(g)"
                [attr.aria-expanded]="activeGroup() === g.label"
                aria-haspopup="menu"
                (click)="toggleGroup(g.label)"
                (keydown.escape)="closeGroup()"
              >
                {{ g.label }}
                <svg
                  class="chevron w-3 h-3 opacity-40"
                  [class.open]="activeGroup() === g.label"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              @if (activeGroup() === g.label) {
                <div class="dropdown" role="menu">
                  <div class="dropdown-content">
                    @for (item of g.items; track item.path) {
                      <a
                        [routerLink]="item.path"
                        routerLinkActive="dropdown-active"
                        class="dropdown-row"
                        role="menuitem"
                        (click)="closeGroup()"
                      >
                        <span class="d-icon">{{ item.icon }}</span>
                        <span>
                          <span class="d-label">{{ item.label }}</span>
                          <span class="d-desc">{{ item.desc }}</span>
                        </span>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </nav>

        <!-- Right controls -->
        <div class="flex items-center gap-2 ml-auto">
          <button
            (click)="toggleTheme()"
            class="theme-toggle"
            [attr.aria-label]="themeSvc.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <div class="knob" [class.spinning]="isAnimating()">
              @if (themeSvc.isDark()) { <span>🌙</span> } @else { <span>☀️</span> }
            </div>
          </button>

          <button
            (click)="toggleMenu()"
            class="btn-icon lg:hidden p-2 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            <div class="burger" [class.is-open]="menuOpen()">
              <span></span><span></span><span></span>
            </div>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      @if (menuOpen()) {
        <div class="mob-menu lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <nav class="mob-inner">
            <a
              routerLink="/"
              (click)="menuOpen.set(false)"
              routerLinkActive="mob-active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="mob-home"
            >🏠 <span>Home</span></a>

            @for (g of navGroups; track g.label; let gi = $index) {
              <section class="mob-section" [style.animation-delay]="(gi * 50) + 'ms'">
                <p class="mob-section-title">{{ g.emoji }} {{ g.label }}</p>
                <div class="mob-chips">
                  @for (item of g.items; track item.path) {
                    <a
                      [routerLink]="item.path"
                      (click)="menuOpen.set(false)"
                      routerLinkActive="mob-chip-active"
                      class="mob-chip"
                    >{{ item.label }}</a>
                  }
                </div>
              </section>
            }
          </nav>
        </div>
      }
    </header>
  `,
  styles: [
    `
      :host { display: block; }

      /* ── Shell ── */
      header { background: transparent; }
      .scrolled {
        background: var(--header-scrolled-bg);
        backdrop-filter: blur(24px) saturate(180%);
        border-bottom: 1px solid var(--border-subtle);
        box-shadow: 0 1px 40px rgba(0, 0, 0, 0.12);
      }

      /* ── Logo ── */
      .logo-mark {
        background: linear-gradient(135deg, #7c3aed, #f59e0b);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
      }
      .logo:hover .logo-mark {
        transform: rotate(8deg) scale(1.12);
        box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
      }

      /* ── Nav pills ── */
      .nav-pill {
        padding: 5px 13px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-secondary);
        transition: color 0.2s, background 0.2s;
        white-space: nowrap;
        cursor: pointer;
        background: transparent;
        border: none;
        display: inline-flex;
        align-items: center;
        text-decoration: none;
      }
      .nav-pill:hover { color: var(--text-primary); background: var(--tab-hover-bg); }
      .nav-active { color: var(--text-primary) !important; background: rgba(124, 58, 237, 0.12) !important; }

      /* ── Chevron ── */
      .chevron { transition: transform 0.25s; }
      .chevron.open { transform: rotate(180deg); }

      /* ── Dropdown ── */
      .group-wrap { display: inline-flex; position: relative; }
      .dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        z-index: 200;
        padding-top: 4px;
        animation: drop-in 0.18s cubic-bezier(0.4, 0, 0.2, 1) both;
      }
      .dropdown-content {
        min-width: 230px;
        background: var(--bg-panel);
        border: 1px solid var(--border-subtle);
        border-radius: 16px;
        box-shadow:
          0 24px 60px rgba(0, 0, 0, 0.28),
          0 0 0 1px rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(24px);
        padding: 6px;
      }
      .dropdown-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 10px;
        border-radius: 10px;
        text-decoration: none;
        transition: background 0.15s;
      }
      .dropdown-row:hover { background: var(--tab-hover-bg); }
      .dropdown-active { background: rgba(124, 58, 237, 0.12) !important; }
      .d-icon {
        width: 30px; height: 30px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 8px;
        background: rgba(139, 92, 246, 0.1);
        font-size: 13px;
        flex-shrink: 0;
        font-family: monospace;
      }
      .d-label { display: block; font-size: 13px; font-weight: 500; color: var(--text-primary); }
      .d-desc { display: block; font-size: 11px; color: var(--text-muted); margin-top: 1px; }

      @keyframes drop-in {
        from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.97); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      }

      /* ── Theme toggle ── */
      .theme-toggle {
        position: relative;
        width: 52px; height: 28px;
        border-radius: 9999px;
        cursor: pointer;
        background: linear-gradient(135deg, #1e293b, #334155);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
        transition: background 0.4s, border-color 0.4s;
      }
      .light .theme-toggle {
        background: linear-gradient(135deg, #fde68a, #fbbf24);
        border-color: rgba(217, 119, 6, 0.2);
      }
      .knob {
        position: absolute; top: 2px; left: 2px;
        width: 24px; height: 24px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #818cf8, #6366f1);
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px;
        transition: left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s;
      }
      .light .knob {
        left: calc(100% - 26px);
        background: linear-gradient(135deg, #fff, #fef3c7);
        box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
      }
      .spinning { animation: spin 0.5s ease-in-out; }
      @keyframes spin {
        0%   { transform: rotate(0) scale(1); }
        50%  { transform: rotate(180deg) scale(0.7); }
        100% { transform: rotate(360deg) scale(1); }
      }

      /* ── Hamburger ── */
      .burger {
        width: 20px; height: 15px;
        display: flex; flex-direction: column; justify-content: space-between;
      }
      .burger span {
        display: block; height: 1.5px;
        background: var(--text-secondary);
        border-radius: 2px;
        transition: transform 0.3s, opacity 0.3s;
        transform-origin: center;
      }
      .burger.is-open span:nth-child(1) { transform: translateY(6.75px) rotate(45deg); }
      .burger.is-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
      .burger.is-open span:nth-child(3) { transform: translateY(-6.75px) rotate(-45deg); }

      /* ── Mobile menu ── */
      .mob-menu {
        position: fixed; inset: 64px 0 0 0;
        background: var(--header-mobile-bg);
        backdrop-filter: blur(24px);
        overflow-y: auto;
        z-index: 49;
        animation: menu-in 0.28s cubic-bezier(0.4, 0, 0.2, 1) both;
      }
      @keyframes menu-in {
        from { opacity: 0; transform: translateY(-10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .mob-inner { padding: 16px 16px 48px; display: flex; flex-direction: column; gap: 4px; }
      .mob-home {
        display: flex; align-items: center; gap: 8px;
        padding: 12px 14px; border-radius: 12px;
        font-size: 14px; font-weight: 600;
        color: var(--text-primary); text-decoration: none;
        transition: background 0.2s;
      }
      .mob-home:hover { background: var(--tab-hover-bg); }
      .mob-active { background: rgba(124, 58, 237, 0.12) !important; }
      .mob-section { animation: mob-item-in 0.3s ease both; }
      @keyframes mob-item-in {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .mob-section-title {
        font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.12em;
        color: var(--gradient-from);
        padding: 10px 14px 6px;
      }
      .mob-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 10px 10px; }
      .mob-chip {
        padding: 7px 14px;
        border-radius: 10px;
        font-size: 13px; font-weight: 500;
        color: var(--text-secondary); text-decoration: none;
        border: 1px solid var(--border-subtle);
        transition: all 0.2s;
      }
      .mob-chip:hover { color: var(--text-primary); background: var(--tab-hover-bg); }
      .mob-chip-active {
        color: var(--text-primary) !important;
        background: rgba(124, 58, 237, 0.12) !important;
        border-color: rgba(124, 58, 237, 0.2) !important;
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
  activeGroup = signal<string | null>(null);

  navGroups: NavGroup[] = [
    {
      label: 'Format', emoji: '{}',
      items: [
        { label: 'JSON',   path: '/json',   icon: '{}', desc: 'JSON ↔ XML, YAML, CSV, SQL' },
        { label: 'Base64', path: '/base64', icon: '🔐', desc: 'Encode & decode data' },
        { label: 'JWT',    path: '/jwt',    icon: '🔑', desc: 'Decode JWT tokens' },
      ],
    },
    {
      label: 'Text', emoji: 'Aa',
      items: [
        { label: 'Regex',  path: '/regex',  icon: '.*', desc: 'Test regular expressions' },
        { label: 'Case',   path: '/utils',  icon: 'Aa', desc: 'Convert text case' },
        { label: 'Number', path: '/number', icon: '01', desc: 'Convert number bases' },
      ],
    },
    {
      label: 'Design', emoji: '🎨',
      items: [
        { label: 'Color',     path: '/color',     icon: '🎨', desc: 'HEX, RGB, HSL converter' },
        { label: 'CSS Units', path: '/css-units', icon: 'px', desc: 'px, rem, em converter' },
      ],
    },
    {
      label: 'Network', emoji: '🌐',
      items: [
        { label: 'URL',        path: '/url',         icon: '🔗', desc: 'Parse & encode URLs' },
        { label: 'cURL',       path: '/curl',        icon: '🌐', desc: 'Convert cURL commands' },
        { label: 'HTTP Codes', path: '/http-status', icon: '📋', desc: 'HTTP status reference' },
      ],
    },
    {
      label: 'Tools', emoji: '🛠️',
      items: [
        { label: 'Password', path: '/password', icon: '🛡️', desc: 'Secure password generator' },
        { label: 'UUID',     path: '/generate', icon: '🔢', desc: 'Generate UUIDs & ULIDs' },
        { label: 'Date',     path: '/date',     icon: '⏱️', desc: 'DateTime tools' },
        { label: 'SQLite',   path: '/db',       icon: '🗄️', desc: 'SQLite viewer' },
      ],
    },
  ];

  isGroupActive(group: NavGroup): boolean {
    const url = this.router.url;
    return group.items.some(
      (item) => url === item.path || url.startsWith(item.path + '/') || url.startsWith(item.path + '?'),
    );
  }

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
        this.activeGroup.set(null);
        this.cdr.markForCheck();
      });
  }

  openGroup(label: string) { this.activeGroup.set(label); }
  closeGroup() { this.activeGroup.set(null); }
  toggleGroup(label: string) { this.activeGroup.update((v) => (v === label ? null : label)); }
  toggleMenu() { this.menuOpen.update((v) => !v); }

  onScroll() {
    if (isPlatformBrowser(this.pid)) this.isScrolled.set(window.scrollY > 10);
  }

  toggleTheme() {
    this.isAnimating.set(true);
    this.themeSvc.toggle();
    setTimeout(() => this.isAnimating.set(false), 500);
  }
}
