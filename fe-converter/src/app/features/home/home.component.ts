import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  PLATFORM_ID,
  NgZone,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="relative">
      <!-- ═══ HERO ═══ -->
      <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 pointer-events-none">
          <div
            id="orb-a"
            class="absolute w-[700px] h-[700px] rounded-full blur-[160px] -top-48 -left-48"
            [style.background]="
              themeSvc.isDark()
                ? 'radial-gradient(circle,rgba(124,58,237,0.15),transparent 70%)'
                : 'radial-gradient(circle,rgba(124,58,237,0.08),transparent 70%)'
            "
          ></div>
          <div
            id="orb-b"
            class="absolute w-[500px] h-[500px] rounded-full blur-[120px] top-1/4 right-0"
            [style.background]="
              themeSvc.isDark()
                ? 'radial-gradient(circle,rgba(245,158,11,0.08),transparent 70%)'
                : 'radial-gradient(circle,rgba(245,158,11,0.06),transparent 70%)'
            "
          ></div>
          <div
            id="orb-c"
            class="absolute w-[400px] h-[400px] rounded-full blur-[100px] bottom-20 left-1/3"
            [style.background]="
              themeSvc.isDark()
                ? 'radial-gradient(circle,rgba(139,92,246,0.1),transparent 70%)'
                : 'radial-gradient(circle,rgba(139,92,246,0.06),transparent 70%)'
            "
          ></div>
        </div>
        <div
          class="absolute inset-0 opacity-30"
          [style.background-image]="
            themeSvc.isDark()
              ? 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)'
              : 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)'
          "
          style="background-size:32px 32px"
        ></div>

        <div class="relative z-10 container mx-auto px-6 lg:px-10 text-center">
          <div
            id="hero-badge"
            class="inline-flex items-center gap-2.5 px-5 py-2 glass rounded-full mb-10"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-xs font-medium tracking-wide" style="color:var(--text-secondary)"
              >Privacy-first &mdash; runs entirely in your browser</span
            >
          </div>

          <h1
            id="hero-title"
            class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6"
          >
            <span class="gradient-text">Dev</span
            ><span style="color:var(--text-primary)">Converter</span>
          </h1>

          <p
            id="hero-sub"
            class="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light"
            style="color:var(--text-secondary)"
          >
            Convert, encode, decode and transform data instantly. The premium developer toolkit,
            redesigned for speed.
          </p>

          <div id="hero-cta" class="flex flex-wrap items-center justify-center gap-4">
            <a routerLink="/json" class="btn-primary">Explore Tools &rarr;</a>
            <a href="#tools" class="btn-secondary">Browse All</a>
          </div>

          <div id="hero-metrics" class="mt-24 grid grid-cols-3 gap-8 max-w-md mx-auto">
            @for (stat of stats; track stat.label) {
              <div class="text-center">
                <div class="text-2xl sm:text-3xl font-bold" style="color:var(--text-primary)">
                  {{ stat.value }}
                </div>
                <div
                  class="text-[11px] uppercase tracking-[0.15em] mt-1.5"
                  style="color:var(--text-muted)"
                >
                  {{ stat.label }}
                </div>
              </div>
            }
          </div>
        </div>

        <div class="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            class="w-4 h-4"
            style="color:var(--text-dim)"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      <!-- ═══ TOOLS ═══ -->
      <section id="tools" class="relative py-32">
        <div class="container mx-auto px-6 lg:px-10">
          <div id="tools-header" class="text-center mb-20">
            <p
              class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-3"
              style="color:var(--gradient-from)"
            >
              Developer Toolkit
            </p>
            <h2
              class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
              style="color:var(--text-primary)"
            >
              Everything in one place
            </h2>
          </div>

          <div id="tools-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (tool of tools; track tool.route) {
              <a [routerLink]="tool.route" class="glass-hover rounded-2xl p-7 block">
                <div class="flex items-start gap-4">
                  <div
                    class="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    [style.background]="tool.bg"
                  >
                    {{ tool.icon }}
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-semibold text-[15px] mb-1.5" style="color:var(--text-primary)">
                      {{ tool.title }}
                    </h3>
                    <p class="text-sm leading-relaxed mb-3" style="color:var(--text-secondary)">
                      {{ tool.desc }}
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                      @for (tag of tool.tags; track tag) {
                        <span
                          class="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-md"
                          style="background:var(--tag-bg);color:var(--tag-text)"
                          >{{ tag }}</span
                        >
                      }
                    </div>
                  </div>
                </div>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- ═══ CTA ═══ -->
      <section class="py-32 relative">
        <div
          class="absolute inset-0"
          style="background:radial-gradient(ellipse at center, rgba(124,58,237,0.04) 0%, transparent 60%)"
        ></div>
        <div class="container mx-auto px-6 lg:px-10 text-center relative z-10">
          <h2
            class="text-3xl sm:text-4xl font-bold mb-4 tracking-tight"
            style="color:var(--text-primary)"
          >
            Ready to convert?
          </h2>
          <p class="mb-10 max-w-md mx-auto font-light" style="color:var(--text-secondary)">
            Pick any tool and start immediately. No sign-up required.
          </p>
          <a routerLink="/json" class="btn-primary text-base px-10 py-4"
            >Open JSON Converter &rarr;</a
          >
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private pid = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  themeSvc = inject(ThemeService);
  private ctx: any;

  stats = [
    { value: '6+', label: 'Categories' },
    { value: '20+', label: 'Converters' },
    { value: '0 kb', label: 'Data Sent' },
  ];

  tools = [
    {
      icon: '{}',
      title: 'JSON Converters',
      route: '/json',
      desc: 'Bidirectional JSON to XML, YAML, CSV, Excel, and SQL.',
      tags: ['xml', 'yaml', 'csv', 'xlsx', 'sql'],
      bg: 'rgba(124,58,237,0.12)',
    },
    {
      icon: '🔐',
      title: 'Base64 Tools',
      route: '/base64',
      desc: 'Encode & decode strings, images, PDFs, and binary data.',
      tags: ['string', 'image', 'pdf', 'binary'],
      bg: 'rgba(245,158,11,0.12)',
    },
    {
      icon: '🗄️',
      title: 'SQLite Viewer',
      route: '/db',
      desc: 'Upload .db files, browse tables, export JSON or CSV.',
      tags: ['sqlite', 'json', 'csv', 'export'],
      bg: 'rgba(6,182,212,0.12)',
    },
    {
      icon: '⏱️',
      title: 'DateTime Tools',
      route: '/date',
      desc: 'Unix timestamps, UTC, ISO 8601, time unit conversions.',
      tags: ['unix', 'utc', 'iso', 'timezone'],
      bg: 'rgba(236,72,153,0.12)',
    },
    {
      icon: '🌐',
      title: 'cURL Converter',
      route: '/curl',
      desc: 'Convert cURL to Fetch, Axios, or Postman collections.',
      tags: ['fetch', 'axios', 'postman'],
      bg: 'rgba(34,197,94,0.12)',
    },
    {
      icon: 'Aa',
      title: 'Case Converter',
      route: '/utils',
      desc: 'Transform text: camelCase, snake_case, kebab-case, etc.',
      tags: ['camel', 'snake', 'kebab', 'pascal'],
      bg: 'rgba(168,85,247,0.12)',
    },
  ];

  ngOnInit() {
    if (!isPlatformBrowser(this.pid)) return;

    const isMobile = window.innerWidth < 768;

    afterNextRender(async () => {
      const gsap = (await import('gsap')).default;

      this.ngZone.runOutsideAngular(() => {
        this.ctx = gsap.context(() => {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          tl.from('#hero-badge', { y: 30, opacity: 0, duration: 0.8 })
            .from('#hero-title', { y: 50, opacity: 0, duration: 1 }, '-=0.5')
            .from('#hero-sub', { y: 30, opacity: 0, duration: 0.8 }, '-=0.6')
            .from('#hero-cta', { y: 20, opacity: 0, duration: 0.7 }, '-=0.5')
            .from(
              '#hero-metrics > div',
              { y: 20, opacity: 0, stagger: 0.12, duration: 0.6 },
              '-=0.3',
            );

          if (!isMobile) {
            gsap.to('#orb-a', {
              x: 60,
              y: 40,
              duration: 10,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
            gsap.to('#orb-b', {
              x: -50,
              y: -30,
              duration: 12,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
            gsap.to('#orb-c', {
              x: 40,
              y: -50,
              duration: 14,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          }
        });
      });

      if (!isMobile) {
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        this.ngZone.runOutsideAngular(() => {
          gsap.from('#tools-header', {
            scrollTrigger: { trigger: '#tools-header', start: 'top 85%' },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power2.out',
          });

          const cards = document.querySelectorAll('#tools-grid > a');
          cards.forEach((card, i) => {
            gsap.from(card, {
              scrollTrigger: { trigger: card, start: 'top 90%' },
              y: 60,
              opacity: 0,
              duration: 0.7,
              delay: i * 0.08,
              ease: 'power2.out',
            });
          });
        });
      }
    });
  }

  ngOnDestroy() {
    this.ctx?.revert();
  }
}
