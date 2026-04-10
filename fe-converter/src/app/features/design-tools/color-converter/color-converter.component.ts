import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ─── Colour types ─────────────────────────────────────────────────────────────
interface RGBA { r: number; g: number; b: number; a: number }

// ─── Parsing ─────────────────────────────────────────────────────────────────

function clampByte(n: number): number { return Math.max(0, Math.min(255, Math.round(n))); }
function clamp01(n: number): number   { return Math.max(0, Math.min(1, n)); }

function parseHexColor(s: string): RGBA | null {
  const hex = s.replace(/^#/, '');
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: 1,
    };
  }
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }
  if (hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }
  return null;
}

function parseRgbColor(s: string): RGBA | null {
  const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i)
         ?? s.match(/rgba?\(\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!m) return null;
  const pct = s.includes('%');
  const r = pct ? (parseFloat(m[1]) / 100) * 255 : parseFloat(m[1]);
  const g = pct ? (parseFloat(m[2]) / 100) * 255 : parseFloat(m[2]);
  const b = pct ? (parseFloat(m[3]) / 100) * 255 : parseFloat(m[3]);
  return { r: clampByte(r), g: clampByte(g), b: clampByte(b), a: m[4] !== undefined ? clamp01(parseFloat(m[4])) : 1 };
}

function parseHslColor(s: string): RGBA | null {
  const m = s.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!m) return null;
  const h = parseFloat(m[1]), sat = parseFloat(m[2]) / 100, l = parseFloat(m[3]) / 100;
  const rgb = hslToRgb(h, sat, l);
  return { ...rgb, a: m[4] !== undefined ? clamp01(parseFloat(m[4])) : 1 };
}

/** Try each parser in order */
function parseAnyColor(input: string): RGBA | null {
  const s = input.trim();
  if (!s) return null;
  if (s.startsWith('#'))         return parseHexColor(s);
  if (/^rgba?\s*\(/i.test(s))   return parseRgbColor(s);
  if (/^hsla?\s*\(/i.test(s))   return parseHslColor(s);
  // Try CSS named colour via a hidden canvas element
  try {
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.fillStyle = s;
    // If the colour was unrecognised, canvas defaults to black
    if (ctx.fillStyle === '#000000' && s.toLowerCase() !== 'black') return null;
    return parseHexColor(ctx.fillStyle);
  } catch {
    return null;
  }
}

// ─── Conversions ──────────────────────────────────────────────────────────────

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if      (h < 60)  [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else              [r, g, b] = [c, 0, x];
  return { r: clampByte((r + m) * 255), g: clampByte((g + m) * 255), b: clampByte((b + m) * 255) };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function linearize(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const lr = linearize(r), lg = linearize(g), lb = linearize(b);
  // Linear sRGB → LMS (Oklab M1)
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  // LMS' → OKLab (Oklab M2)
  const L  =  0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const A  =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const B  =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C  = Math.sqrt(A * A + B * B);
  const H  = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return {
    l: Math.round(L * 1000) / 10,    // 0–100
    c: Math.round(C * 10000) / 10000,
    h: Math.round(H * 100)  / 100,
  };
}

function toHex2(n: number): string { return clampByte(n).toString(16).padStart(2, '0'); }

// ─── Output formatters ────────────────────────────────────────────────────────
interface OutputFormat {
  key:   string;
  label: string;
  value: (c: RGBA) => string;
}

const FORMATS: OutputFormat[] = [
  { key: 'hex',   label: 'HEX',   value: (c) => `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}`.toUpperCase() },
  { key: 'hex8',  label: 'HEX8',  value: (c) => `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}${toHex2(Math.round(c.a * 255))}`.toUpperCase() },
  { key: 'rgb',   label: 'RGB',   value: (c) => `rgb(${c.r}, ${c.g}, ${c.b})` },
  { key: 'rgba',  label: 'RGBA',  value: (c) => `rgba(${c.r}, ${c.g}, ${c.b}, ${+c.a.toFixed(3)})` },
  {
    key: 'hsl', label: 'HSL',
    value: (c) => { const { h, s, l } = rgbToHsl(c.r, c.g, c.b); return `hsl(${h}, ${s}%, ${l}%)`; },
  },
  {
    key: 'hsla', label: 'HSLA',
    value: (c) => { const { h, s, l } = rgbToHsl(c.r, c.g, c.b); return `hsla(${h}, ${s}%, ${l}%, ${+c.a.toFixed(3)})`; },
  },
  {
    key: 'oklch', label: 'OKLCH',
    value: (c) => {
      const { l, c: chroma, h } = rgbToOklch(c.r, c.g, c.b);
      return `oklch(${l}% ${chroma} ${h})`;
    },
  },
];

// ─── Palette generation (tints + base + shades) ───────────────────────────────
interface Swatch { hex: string; label: string; isBase?: boolean }

function generatePalette(rgba: RGBA): Swatch[] {
  const { r, g, b } = rgba;
  const { h, s, l } = rgbToHsl(r, g, b);
  const steps = 5;
  const swatches: Swatch[] = [];
  // Tints: move L toward 100
  for (let i = steps; i >= 1; i--) {
    const lt = l + (i * (100 - l)) / (steps + 1);
    const rgb = hslToRgb(h, s / 100, lt / 100);
    swatches.push({ hex: `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`, label: `+${i * 20}` });
  }
  // Base
  swatches.push({ hex: `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`, label: 'Base', isBase: true });
  // Shades: move L toward 0
  for (let i = 1; i <= steps; i++) {
    const ls = l * (1 - i / (steps + 1));
    const rgb = hslToRgb(h, s / 100, ls / 100);
    swatches.push({ hex: `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`, label: `-${i * 20}` });
  }
  return swatches;
}

@Component({
  selector: 'app-color-converter',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen" style="padding: 80px 0 64px">
      <div class="container mx-auto px-6 lg:px-10 max-w-3xl">

        <div class="tool-page-header">
          <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
             style="color:var(--gradient-from)">Design Tools</p>
          <h1 class="text-3xl font-bold tracking-tight mb-1" style="color:var(--text-primary)">
            Color Converter
          </h1>
          <p class="text-sm" style="color:var(--text-muted)">
            HEX · RGB · HSL · OKLCH — paste any format and get all others instantly.
          </p>
        </div>

        <!-- Input row -->
        <div class="flex items-center gap-4 my-6">
          <!-- Colour swatch -->
          <div class="w-16 h-16 rounded-2xl flex-shrink-0 transition-all duration-200 shadow-lg"
               [style.background]="swatchColor()"
               [style.box-shadow]="'0 4px 24px ' + swatchColor() + '66'">
          </div>

          <div class="flex-1">
            <input [ngModel]="rawInput()" (ngModelChange)="rawInput.set($event)"
                   type="text" spellcheck="false"
                   placeholder="#7c3aed  ·  rgb(124,58,237)  ·  hsl(263,73%,58%)  ·  oklch(…)"
                   class="w-full px-4 py-3 rounded-xl font-mono text-sm focus:outline-none transition-all"
                   [style.border]="'1px solid ' + (parseError() ? '#ef4444' : 'var(--border-subtle)')"
                   style="background:var(--bg-input);color:var(--text-primary)"/>
            @if (parseError()) {
              <p class="text-xs mt-1.5 font-mono" style="color:#ef4444">{{ parseError() }}</p>
            }
          </div>
        </div>

        <!-- Output grid -->
        @if (parsed()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            @for (fmt of formats; track fmt.key) {
              <div class="rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors duration-200"
                   style="background:var(--bg-card);border:1px solid var(--border-subtle)">
                <div class="min-w-0">
                  <p class="text-[11px] uppercase tracking-wider mb-1 font-semibold"
                     style="color:var(--text-muted)">{{ fmt.label }}</p>
                  <code class="text-sm font-mono break-all" style="color:var(--text-primary)">
                    {{ fmt.value(parsed()!) }}
                  </code>
                </div>
                <button (click)="copy(fmt.value(parsed()!))" class="btn-icon flex-shrink-0" title="Copy">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            }
          </div>

          <!-- Tints + Shades palette -->
          <div>
            <p class="text-[11px] uppercase tracking-[0.15em] font-semibold mb-3" style="color:var(--text-muted)">
              Tints &amp; Shades
            </p>
            <div class="flex gap-2 flex-wrap">
              @for (swatch of palette(); track swatch.hex) {
                <div class="flex flex-col items-center gap-1.5 cursor-pointer group"
                     (click)="rawInput.set(swatch.hex)">
                  <div class="w-10 h-10 rounded-xl transition-transform duration-200 group-hover:scale-110 group-hover:shadow-lg"
                       [style.background]="swatch.hex"
                       [class.ring-2]="swatch.isBase"
                       [style.ring-color]="swatch.isBase ? 'white' : undefined"
                       [style.outline]="swatch.isBase ? '2px solid rgba(255,255,255,0.4)' : 'none'">
                  </div>
                  <span class="text-[9px] font-mono" style="color:var(--text-dim)">{{ swatch.label }}</span>
                </div>
              }
            </div>
            <p class="text-xs mt-3" style="color:var(--text-dim)">Click any swatch to use it as the input.</p>
          </div>
        } @else if (rawInput().trim()) {
          <div class="text-center py-16" style="color:var(--text-muted)">
            Could not recognise colour format. Try: <code class="font-mono">#7c3aed</code>,
            <code class="font-mono">rgb(124,58,237)</code>, or <code class="font-mono">hsl(263,73%,58%)</code>
          </div>
        } @else {
          <div class="text-center py-16" style="color:var(--text-muted)">
            <div class="text-4xl mb-3 opacity-30">🎨</div>
            <p class="text-sm">Enter any CSS colour value above to convert it.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorConverterComponent {
  readonly formats = FORMATS;

  rawInput = signal('#7c3aed');

  parsed = computed((): RGBA | null => {
    const s = this.rawInput().trim();
    if (!s) return null;
    return parseAnyColor(s);
  });

  parseError = computed(() => {
    const s = this.rawInput().trim();
    if (!s) return '';
    return this.parsed() ? '' : 'Unrecognised colour format';
  });

  swatchColor = computed(() => {
    const c = this.parsed();
    if (!c) return 'transparent';
    return `rgba(${c.r},${c.g},${c.b},${c.a})`;
  });

  palette = computed(() => {
    const c = this.parsed();
    return c ? generatePalette(c) : [];
  });

  copy(value: string) {
    navigator.clipboard.writeText(value);
  }
}
