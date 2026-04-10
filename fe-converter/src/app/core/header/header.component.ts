import {
  Component,
  signal,
  computed,
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
    <!-- The entire header is one hover zone. mouseleave on <header> starts the close timer.
         Moving from nav bar down into the mega panel never fires mouseleave because the panel
         is a DOM child of <header>. This eliminates the hover-gap problem entirely. -->
    <header
      class="fixed top-0 left-0 w-full z-50 transition-all duration-500"
      [class.scrolled]="isScrolled()"
      (mouseleave)="scheduleClose()"
    >
      <!-- ── Bar ── -->
      <div class="h-16 relative flex items-center px-5 lg:px-8 max-w-[1400px] mx-auto">

        <!-- Logo -->
        <a routerLink="/" class="logo flex items-center gap-2.5 flex-shrink-0">
          <div class="logo-mark w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-[10px] tracking-tight">DC</div>
          <span class="text-[15px] font-bold gradient-text hidden sm:block tracking-tight">DevConverter</span>
        </a>

        <!-- Desktop nav — absolutely centered so it's never pushed by logo/controls width -->
        <nav
          class="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2"
          aria-label="Main navigation"
        >
          <a
            routerLink="/"
            routerLinkActive="nav-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-pill"
            (mouseenter)="scheduleClose()"
          >Home</a>

          @for (g of navGroups; track g.label) {
            <button
              class="nav-pill relative"
              [class.nav-open]="activeGroup() === g.label"
              [class.nav-active]="isGroupActive(g)"
              [attr.aria-expanded]="activeGroup() === g.label"
              aria-haspopup="true"
              (mouseenter)="openGroup(g.label)"
              (click)="toggleGroup(g.label)"
              (keydown.escape)="closeGroup()"
            >
              {{ g.label }}
              <!-- animated dot indicator connecting button to mega panel -->
              <span class="open-dot" [class.visible]="activeGroup() === g.label"></span>
            </button>
          }
        </nav>

        <!-- Right controls -->
        <div class="flex items-center gap-2 ml-auto flex-shrink-0">
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

      <!-- ── Mega panel ── lives INSIDE <header>, so mouse moving from nav → panel
           never leaves the header boundary → no accidental close -->
      @if (activeGroup() !== null) {
        <div
          class="mega hidden lg:block"
          role="region"
          [attr.aria-label]="activeGroup()! + ' tools'"
          (mouseenter)="cancelClose()"
        >
          <div class="mega-inner px-5 lg:px-8 max-w-[1400px] mx-auto">
            <p class="mega-eyebrow">{{ activeGroup() }}</p>
            <div class="mega-grid">
              @for (item of activeItems(); track item.path; let i = $index) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="mega-active"
                  class="mega-card"
                  [style.animation-delay]="(i * 45) + 'ms'"
                  (click)="closeGroup()"
                >
                  <span class="mega-icon">{{ item.icon }}</span>
                  <span class="flex flex-col min-w-0">
                    <span class="mega-name">{{ item.label }}</span>
                    <span class="mega-desc">{{ item.desc }}</span>
                  </span>
                </a>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── Mobile menu ── -->
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
              <section class="mob-section" [style.animation-delay]="(gi * 55) + 'ms'">
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

      /* ── Header shell ── */
      header { background: transparent; }
      .scrolled {
        background: var(--header-scrolled-bg);
        backdrop-filter: blur(24px) saturate(180%);
        border-bottom: 1px solid var(--border-subtle);
        box-shadow: 0 1px 40px rgba(0, 0, 0, 0.14);
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
        position: relative;
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
      .nav-pill:hover,
      .nav-open { color: var(--text-primary); background: rgba(139, 92, 246, 0.08); }
      .nav-active { color: var(--text-primary) !important; background: rgba(124, 58, 237, 0.12) !important; }

      /* animated dot under the active group button */
      .open-dot {
        position: absolute;
        bottom: -18px;
        left: 50%;
        transform: translateX(-50%) scale(0);
        width: 5px; height: 5px;
        border-radius: 50%;
        background: var(--gradient-from);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;
        opacity: 0;
      }
      .open-dot.visible { transform: translateX(-50%) scale(1); opacity: 1; }

      /* ── Mega panel ── */
      .mega {
        border-top: 1px solid var(--border-subtle);
        background: var(--header-mobile-bg);
        backdrop-filter: blur(28px) saturate(180%);
        padding: 20px 0 22px;
        animation: mega-slide 0.22s cubic-bezier(0.4, 0, 0.2, 1) both;
      }
      @keyframes mega-slide {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .mega-eyebrow {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--gradient-from);
        margin-bottom: 12px;
      }
      .mega-grid {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .mega-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 13px 16px;
        border-radius: 14px;
        border: 1px solid var(--border-subtle);
        background: var(--glass-bg);
        text-decoration: none;
        flex: 1 1 160px;
        max-width: 280px;
        transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        animation: card-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) both;
      }
      .mega-card:hover {
        background: var(--bg-card-hover);
        border-color: var(--border-hover);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(124, 58, 237, 0.1);
      }
      .mega-active {
        background: rgba(124, 58, 237, 0.08) !important;
        border-color: rgba(124, 58, 237, 0.22) !important;
      }
      @keyframes card-in {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .mega-icon {
        width: 38px; height: 38px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 10px;
        background: rgba(139, 92, 246, 0.1);
        font-size: 16px; font-weight: 700;
        font-family: monospace;
        flex-shrink: 0;
      }
      .mega-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
      .mega-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; line-height: 1.35; }

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

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

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

  activeItems = computed(() => this.navGroups.find((g) => g.label === this.activeGroup())?.items ?? []);

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

  openGroup(label: string) {
    this.cancelClose();
    this.activeGroup.set(label);
  }

  closeGroup() {
    this.cancelClose();
    this.activeGroup.set(null);
  }

  scheduleClose() {
    this.cancelClose();
    this.closeTimer = setTimeout(() => {
      this.activeGroup.set(null);
      this.closeTimer = null;
    }, 180);
  }

  cancelClose() {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  toggleGroup(label: string) {
    if (this.activeGroup() === label) {
      this.closeGroup();
    } else {
      this.openGroup(label);
    }
  }

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
