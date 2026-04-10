import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ─── Pure conversion helpers ─────────────────────────────────────────────────

/** Normalise an input string by removing formatting, then parse as BigInt */
function parseToBigInt(raw: string, base: number): bigint | null {
  const s = raw.trim().replace(/[\s_,]/g, '').toLowerCase();
  if (!s || s === '-') return null;

  const negative = s.startsWith('-');
  const abs = negative ? s.slice(1) : s;

  // Strip recognised prefixes regardless of the 'base' param
  let digits = abs;
  if (abs.startsWith('0x'))      digits = abs.slice(2);
  else if (abs.startsWith('0b')) digits = abs.slice(2);
  else if (abs.startsWith('0o')) digits = abs.slice(2);

  // Validate characters for the given base
  const valid = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, base);
  if (!digits || [...digits].some((c) => !valid.includes(c))) return null;

  try {
    // Use built-in BigInt parsing for speed
    const prefix = base === 16 ? '0x' : base === 2 ? '0b' : base === 8 ? '0o' : '';
    const val = BigInt(`${prefix}${digits}`);
    return negative ? -val : val;
  } catch {
    return null;
  }
}

/** Format a BigInt into a given base string */
function formatBigInt(value: bigint, base: number): string {
  const neg    = value < 0n;
  const absStr = (neg ? -value : value).toString(base).toUpperCase();
  return neg ? '-' + absStr : absStr;
}

/** Format binary string into groups of 4 (nibbles) separated by spaces */
function nibblify(bin: string): string {
  const padded = bin.padStart(Math.ceil(bin.length / 4) * 4, '0');
  return padded.match(/.{1,4}/g)!.join(' ');
}

interface BaseField {
  key:    'dec' | 'hex' | 'bin' | 'oct';
  label:  string;
  base:   number;
  prefix: string;
  placeholder: string;
}

const FIELDS: BaseField[] = [
  { key: 'dec', label: 'Decimal',     base: 10, prefix: '',   placeholder: '255' },
  { key: 'hex', label: 'Hexadecimal', base: 16, prefix: '0x', placeholder: 'FF' },
  { key: 'bin', label: 'Binary',      base:  2, prefix: '0b', placeholder: '1111 1111' },
  { key: 'oct', label: 'Octal',       base:  8, prefix: '0o', placeholder: '377' },
];

@Component({
  selector: 'app-number-base',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen" style="padding: 80px 0 64px">
      <div class="container mx-auto px-6 lg:px-10 max-w-2xl">

        <div class="tool-page-header">
          <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
             style="color:var(--gradient-from)">Text Utilities</p>
          <h1 class="text-3xl font-bold tracking-tight mb-1" style="color:var(--text-primary)">
            Number Base Converter
          </h1>
          <p class="text-sm" style="color:var(--text-muted)">
            Convert between Decimal, Hex, Binary, and Octal. Supports BigInt for large values.
          </p>
        </div>

        <!-- Input fields -->
        <div class="rounded-2xl overflow-hidden mt-6" style="border:1px solid var(--border-subtle)">
          @for (f of fields; track f.key; let last = $last) {
            <div class="px-5 py-4 transition-colors duration-200"
                 [style.border-bottom]="last ? 'none' : '1px solid var(--border-subtle)'"
                 [style.background]="activeKey() === f.key ? 'rgba(139,92,246,0.04)' : 'transparent'">

              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold" style="color:var(--text-secondary)">{{ f.label }}</span>
                  <code class="text-[11px] font-mono px-1.5 py-0.5 rounded"
                        style="background:var(--tag-bg);color:var(--text-muted)">base {{ f.base }}</code>
                </div>
                @if (values()[f.key]) {
                  <button (click)="copy(f.key)" class="btn-icon" title="Copy">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>
                }
              </div>

              <input type="text" spellcheck="false"
                     [ngModel]="activeKey() === f.key ? rawInputs()[f.key] : (displayValues()[f.key] ?? '')"
                     (focus)="onFocus(f.key)"
                     (ngModelChange)="onInput(f.key, $event)"
                     [placeholder]="f.prefix + f.placeholder"
                     class="w-full px-4 py-2.5 rounded-xl font-mono text-sm focus:outline-none transition-all"
                     style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-primary)"/>
            </div>
          }
        </div>

        <!-- Binary nibble view -->
        @if (binNibbles()) {
          <div class="mt-4 p-5 rounded-2xl" style="background:var(--bg-card);border:1px solid var(--border-subtle)">
            <p class="text-[11px] uppercase tracking-wider mb-3 font-medium" style="color:var(--text-muted)">
              Binary — nibble view
            </p>
            <code class="font-mono text-sm break-all leading-loose" style="color:var(--output-brand)">
              {{ binNibbles() }}
            </code>
          </div>
        }

        <!-- Error -->
        @if (error()) {
          <div class="mt-4 px-5 py-3 rounded-xl text-sm font-mono"
               style="color:#ef4444;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12)">
            {{ error() }}
          </div>
        }

        <!-- Info strip -->
        @if (currentBigInt() !== null) {
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="p-4 rounded-xl text-sm" style="background:var(--bg-card);border:1px solid var(--border-subtle)">
              <p class="text-[11px] uppercase tracking-wider mb-1" style="color:var(--text-muted)">Bit length</p>
              <p class="font-mono font-semibold" style="color:var(--text-primary)">
                {{ bitLength() }} bits
              </p>
            </div>
            <div class="p-4 rounded-xl text-sm" style="background:var(--bg-card);border:1px solid var(--border-subtle)">
              <p class="text-[11px] uppercase tracking-wider mb-1" style="color:var(--text-muted)">Sign</p>
              <p class="font-mono font-semibold" [style.color]="signColor()">
                {{ signLabel() }}
              </p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberBaseComponent {
  readonly fields = FIELDS;

  activeKey   = signal<BaseField['key'] | null>(null);
  rawInputs   = signal<Partial<Record<BaseField['key'], string>>>({});
  currentBigInt = signal<bigint | null>(null);
  error       = signal('');

  /** Display values derived from currentBigInt for non-active fields */
  displayValues = signal<Partial<Record<BaseField['key'], string>>>({});

  /** Short-hand to read any field value (raw if active, derived otherwise) */
  values = this.displayValues;

  onFocus(key: BaseField['key']) {
    this.activeKey.set(key);
  }

  onInput(key: BaseField['key'], raw: string) {
    this.rawInputs.update((r) => ({ ...r, [key]: raw }));
    this.activeKey.set(key);

    const field = FIELDS.find((f) => f.key === key)!;
    const val   = parseToBigInt(raw, field.base);

    if (raw.trim() === '' || raw.trim() === '-') {
      this.currentBigInt.set(null);
      this.displayValues.set({});
      this.error.set('');
      return;
    }

    if (val === null) {
      this.error.set(`Invalid ${field.label.toLowerCase()} value`);
      return;
    }

    this.error.set('');
    this.currentBigInt.set(val);

    // Derive all other bases
    const derived: Partial<Record<BaseField['key'], string>> = {};
    for (const f of FIELDS) {
      if (f.key === key) {
        derived[f.key] = raw; // keep what the user typed
      } else {
        derived[f.key] = formatBigInt(val, f.base);
      }
    }
    this.displayValues.set(derived);
  }

  binNibbles(): string | null {
    const b = this.displayValues()['bin'];
    if (!b || this.currentBigInt() === null) return null;
    const clean = b.startsWith('-') ? b.slice(1) : b;
    const nibbled = nibblify(clean);
    return b.startsWith('-') ? '-' + nibbled : nibbled;
  }

  bitLength(): number {
    const v = this.currentBigInt();
    if (v === null) return 0;
    const abs = v < 0n ? -v : v;
    return abs === 0n ? 1 : abs.toString(2).length;
  }

  signColor(): string {
    const v = this.currentBigInt();
    return v !== null && v < 0n ? '#f87171' : '#4ade80';
  }

  signLabel(): string {
    const v = this.currentBigInt();
    if (v === null) return '';
    if (v < 0n) return 'Negative';
    if (v === 0n) return 'Zero';
    return 'Positive';
  }

  copy(key: BaseField['key']) {
    const v = this.displayValues()[key];
    if (v) navigator.clipboard.writeText(v);
  }
}
