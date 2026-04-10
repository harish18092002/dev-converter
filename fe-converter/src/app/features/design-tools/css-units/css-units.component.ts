import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// All supported units and their conversion factors to/from px
interface UnitDef {
  key: string;
  label: string;
  desc: string;
  group: 'absolute' | 'relative' | 'viewport';
  toPx: (v: number, cfg: ConversionConfig) => number;
  fromPx: (px: number, cfg: ConversionConfig) => number;
}

interface ConversionConfig {
  rootFontSize: number;   // default 16
  parentFontSize: number; // default 16
  parentSize: number;     // for % (default 16)
  viewportW: number;      // default 1440
  viewportH: number;      // default 900
}

const UNITS: UnitDef[] = [
  {
    key: 'px', label: 'px', desc: 'Pixels (CSS reference pixel)',
    group: 'absolute',
    toPx: (v) => v,
    fromPx: (px) => px,
  },
  {
    key: 'rem', label: 'rem', desc: 'Relative to root <html> font-size',
    group: 'relative',
    toPx: (v, c) => v * c.rootFontSize,
    fromPx: (px, c) => px / c.rootFontSize,
  },
  {
    key: 'em', label: 'em', desc: 'Relative to parent element font-size',
    group: 'relative',
    toPx: (v, c) => v * c.parentFontSize,
    fromPx: (px, c) => px / c.parentFontSize,
  },
  {
    key: 'pct', label: '%', desc: 'Percentage of parent element size',
    group: 'relative',
    toPx: (v, c) => (v / 100) * c.parentSize,
    fromPx: (px, c) => (px / c.parentSize) * 100,
  },
  {
    key: 'vw', label: 'vw', desc: 'Percentage of viewport width',
    group: 'viewport',
    toPx: (v, c) => (v / 100) * c.viewportW,
    fromPx: (px, c) => (px / c.viewportW) * 100,
  },
  {
    key: 'vh', label: 'vh', desc: 'Percentage of viewport height',
    group: 'viewport',
    toPx: (v, c) => (v / 100) * c.viewportH,
    fromPx: (px, c) => (px / c.viewportH) * 100,
  },
  {
    key: 'vmin', label: 'vmin', desc: 'Percentage of the smaller viewport dimension',
    group: 'viewport',
    toPx: (v, c) => (v / 100) * Math.min(c.viewportW, c.viewportH),
    fromPx: (px, c) => (px / Math.min(c.viewportW, c.viewportH)) * 100,
  },
  {
    key: 'vmax', label: 'vmax', desc: 'Percentage of the larger viewport dimension',
    group: 'viewport',
    toPx: (v, c) => (v / 100) * Math.max(c.viewportW, c.viewportH),
    fromPx: (px, c) => (px / Math.max(c.viewportW, c.viewportH)) * 100,
  },
  {
    key: 'pt', label: 'pt', desc: 'Points — 1pt = 1.333…px (96/72)',
    group: 'absolute',
    toPx: (v) => v * (96 / 72),
    fromPx: (px) => px * (72 / 96),
  },
  {
    key: 'pc', label: 'pc', desc: 'Picas — 1pc = 16px (12pt)',
    group: 'absolute',
    toPx: (v) => v * 16,
    fromPx: (px) => px / 16,
  },
  {
    key: 'in', label: 'in', desc: 'Inches — 1in = 96px',
    group: 'absolute',
    toPx: (v) => v * 96,
    fromPx: (px) => px / 96,
  },
  {
    key: 'cm', label: 'cm', desc: 'Centimetres — 1cm ≈ 37.795px',
    group: 'absolute',
    toPx: (v) => v * (96 / 2.54),
    fromPx: (px) => px / (96 / 2.54),
  },
  {
    key: 'mm', label: 'mm', desc: 'Millimetres — 1mm ≈ 3.78px',
    group: 'absolute',
    toPx: (v) => v * (96 / 25.4),
    fromPx: (px) => px / (96 / 25.4),
  },
];

function fmt(n: number): string {
  if (!isFinite(n)) return '—';
  // Show enough significant digits without trailing zeros
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs >= 1000) return n.toFixed(2);
  if (abs >= 100)  return n.toFixed(3);
  if (abs >= 10)   return n.toFixed(4);
  if (abs >= 1)    return n.toFixed(5);
  return n.toPrecision(5);
}

@Component({
  selector: 'app-css-units',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen" style="padding: 80px 0 64px">
      <div class="container mx-auto px-6 lg:px-10 max-w-4xl">

        <div class="tool-page-header">
          <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
             style="color:var(--gradient-from)">Design Tools</p>
          <h1 class="text-3xl font-bold tracking-tight mb-1" style="color:var(--text-primary)">
            CSS Unit Converter
          </h1>
          <p class="text-sm" style="color:var(--text-muted)">
            Convert between all CSS length units in real time.
          </p>
        </div>

        <!-- Settings row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 my-6 p-5 rounded-2xl"
             style="background:var(--bg-card);border:1px solid var(--border-subtle)">
          @for (cfg of configFields; track cfg.key) {
            <div>
              <label class="block text-[11px] uppercase tracking-wider mb-1.5 font-medium"
                     style="color:var(--text-muted)">{{ cfg.label }}</label>
              <input type="number" [ngModel]="getConfig(cfg.key)" (ngModelChange)="setConfig(cfg.key, $event)"
                     min="1" class="w-full px-3 py-2 rounded-lg text-sm font-mono focus:outline-none"
                     style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-primary)"/>
            </div>
          }
        </div>

        <!-- Unit rows -->
        <div class="rounded-2xl overflow-hidden" style="border:1px solid var(--border-subtle)">
          <!-- Header -->
          <div class="px-5 py-3 grid grid-cols-[120px_1fr_180px] gap-4 items-center"
               style="background:var(--bg-toolbar);border-bottom:1px solid var(--border-subtle)">
            <span class="text-[11px] uppercase tracking-wider font-semibold" style="color:var(--text-muted)">Unit</span>
            <span class="text-[11px] uppercase tracking-wider font-semibold" style="color:var(--text-muted)">Value</span>
            <span class="text-[11px] uppercase tracking-wider font-semibold" style="color:var(--text-muted)">Description</span>
          </div>

          @for (unit of allUnits; track unit.key; let last = $last) {
            <div class="px-5 py-3.5 grid grid-cols-[120px_1fr_180px] gap-4 items-center transition-colors duration-200
                        hover:bg-[rgba(255,255,255,0.02)]"
                 [style.border-bottom]="last ? 'none' : '1px solid var(--border-subtle)'">

              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-sm" style="color:var(--gradient-from)">{{ unit.label }}</span>
                <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                      [style.background]="groupColor(unit.group).bg"
                      [style.color]="groupColor(unit.group).text">
                  {{ unit.group }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <input type="number" [ngModel]="inputValues()[unit.key]"
                       (ngModelChange)="onUnitInput(unit.key, $event)"
                       [placeholder]="convertedValues()[unit.key]"
                       class="w-40 px-3 py-1.5 rounded-lg text-sm font-mono focus:outline-none transition-colors"
                       style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-primary)"/>
                <span class="text-sm font-mono" style="color:var(--text-secondary)">
                  {{ convertedValues()[unit.key] ?? '—' }}
                </span>
              </div>

              <p class="text-xs" style="color:var(--text-muted)">{{ unit.desc }}</p>
            </div>
          }
        </div>

        <p class="mt-4 text-xs text-center" style="color:var(--text-dim)">
          Edit any field — all units update instantly
        </p>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CssUnitsComponent {
  readonly allUnits = UNITS;

  // Configuration (what the user can tune)
  rootFontSize  = signal(16);
  parentFontSize = signal(16);
  parentSize    = signal(16);
  viewportW     = signal(1440);
  viewportH     = signal(900);

  configFields = [
    { key: 'rootFontSize',   label: 'Root font-size (px)' },
    { key: 'parentFontSize', label: 'Parent font-size (px)' },
    { key: 'parentSize',     label: 'Parent size (px) for %' },
    { key: 'viewportW',      label: 'Viewport width (px)' },
  ];

  getConfig(key: string): number {
    return (this as any)[key]();
  }

  setConfig(key: string, v: number) {
    const n = Number(v);
    if (!isFinite(n) || n <= 0) return;
    (this as any)[key].set(n);
    // Recompute all converted values from the current source
    if (this.sourceUnit()) this.onUnitInput(this.sourceUnit()!, this.sourceValue);
  }

  private cfg = computed<ConversionConfig>(() => ({
    rootFontSize:   this.rootFontSize(),
    parentFontSize: this.parentFontSize(),
    parentSize:     this.parentSize(),
    viewportW:      this.viewportW(),
    viewportH:      this.viewportH(),
  }));

  // The unit the user is actively editing (source of truth)
  sourceUnit  = signal<string | null>(null);
  sourceValue = 0;

  // The raw string values in inputs (for display)
  inputValues = signal<Record<string, string>>({});

  // All converted display values
  convertedValues = computed<Record<string, string>>(() => {
    const src = this.sourceUnit();
    if (!src) return {};
    const srcDef = UNITS.find((u) => u.key === src)!;
    const px = srcDef.toPx(this.sourceValue, this.cfg());
    const out: Record<string, string> = {};
    for (const u of UNITS) {
      if (u.key === src) continue;
      out[u.key] = fmt(u.fromPx(px, this.cfg()));
    }
    return out;
  });

  onUnitInput(key: string, rawValue: string | number) {
    const v = Number(rawValue);
    if (!isFinite(v)) return;
    this.sourceUnit.set(key);
    this.sourceValue = v;
    this.inputValues.update((prev) => ({ ...prev, [key]: String(rawValue) }));
  }

  groupColor(group: string) {
    const map: Record<string, { bg: string; text: string }> = {
      absolute: { bg: 'rgba(34,197,94,0.1)',   text: '#4ade80' },
      relative: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
      viewport: { bg: 'rgba(6,182,212,0.1)',   text: '#22d3ee' },
    };
    return map[group] ?? map['absolute'];
  }
}
