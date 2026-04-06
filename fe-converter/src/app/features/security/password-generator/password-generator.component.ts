import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ─── Character sets ───────────────────────────────────────────────────────────
const CHARS = {
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower:   'abcdefghijklmnopqrstuvwxyz',
  digits:  '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const AMBIGUOUS = new Set([...'0Ol1I']);

// EFF-inspired compact word list (200 memorable words for passphrases)
const WORDS = `able acid aged also arch area army away baby back ball band bark base bath
bear beat been bill bite blow blue boat body bold bond bone book born boss
both bowl bred brew brow bulk bull burn busy cage cake calm camp card care
cart case cash cast cave chef chip chop city clam clap clay clip club coal
coat code coil cold come cone cook cool copy cord cork corn cost coup cove
crew crop cure curl damp dare dark data dawn daze dead deaf dean deep deer
deny desk diet dill dip dire dish disk dock dome done dose dote dove down
drag draw drew drip drop drum dual dull dump dusk dust duty each earl ease
east edge emit epic even exam exit face fact fail faint fall fame farm fast
fate fawn feed feel felt fern fill film find fire firm fish fist five flag
flaw flew flux foam foil fold fond font food foot ford fork fort foul four
free from fuel full fury fuse gain game gang gate gave gaze gear geld gent
gift girl give glad glow glue goat golf gone good grab gray grew grid grim
grin grip grow gulf gust gyre hack half halt hang harm harp hash haul have
hawk haze head heal heap help here hide high hill hint hire hive hold hole
home hope horn host hour hull hung hunt idle inch into iris iron isle item`.split(/\s+/).filter(Boolean);

// ─── Crypto random helpers ────────────────────────────────────────────────────
function cryptoRandInt(max: number): number {
  // Rejection sampling for uniform distribution
  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);
  let v: number;
  do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
  return v % max;
}

function generatePassword(charset: string, length: number): string {
  if (!charset) return '';
  return Array.from({ length }, () => charset[cryptoRandInt(charset.length)]).join('');
}

function generatePassphrase(wordCount: number, separator: string): string {
  return Array.from({ length: wordCount }, () => WORDS[cryptoRandInt(WORDS.length)]).join(separator);
}

// ─── Entropy / Strength ───────────────────────────────────────────────────────
function entropy(charsetSize: number, length: number): number {
  if (charsetSize <= 0 || length <= 0) return 0;
  return Math.floor(length * Math.log2(charsetSize));
}

function strengthLabel(bits: number): { label: string; color: string; pct: number } {
  if (bits < 40) return { label: 'Weak',        color: '#f87171', pct: 20 };
  if (bits < 60) return { label: 'Fair',         color: '#fbbf24', pct: 45 };
  if (bits < 80) return { label: 'Strong',       color: '#34d399', pct: 70 };
  if (bits < 128) return { label: 'Very Strong', color: '#60a5fa', pct: 90 };
  return { label: 'Exceptional', color: '#a78bfa', pct: 100 };
}

type Mode = 'password' | 'passphrase';
const SEPARATORS = [
  { label: '– Hyphen',   value: '-'  },
  { label: '_ Underscore', value: '_' },
  { label: '. Period',   value: '.'  },
  { label: '  Space',   value: ' '  },
  { label: '# Hash',    value: '#'  },
];

@Component({
  selector: 'app-password-generator',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen" style="padding: 80px 0 64px">
      <div class="container mx-auto px-6 lg:px-10 max-w-2xl">

        <div class="tool-page-header">
          <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
             style="color:var(--gradient-from)">Security</p>
          <h1 class="text-3xl font-bold tracking-tight mb-1" style="color:var(--text-primary)">
            Password Generator
          </h1>
          <p class="text-sm" style="color:var(--text-muted)">
            Cryptographically secure — using Web Crypto API, nothing leaves your browser.
          </p>
        </div>

        <!-- Mode toggle -->
        <div class="tab-bar my-6 w-fit">
          <button class="tab-btn" [class.active]="mode() === 'password'" (click)="mode.set('password')">Password</button>
          <button class="tab-btn" [class.active]="mode() === 'passphrase'" (click)="mode.set('passphrase')">Passphrase</button>
        </div>

        <!-- Options card -->
        <div class="rounded-2xl p-5 mb-5" style="background:var(--bg-card);border:1px solid var(--border-subtle)">
          @if (mode() === 'password') {
            <!-- Length slider -->
            <div class="mb-5">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium" style="color:var(--text-secondary)">Length</label>
                <input type="number" [ngModel]="length()" (ngModelChange)="setLength($event)"
                       min="4" max="256" class="w-16 px-2 py-1 rounded-lg text-sm font-mono text-center focus:outline-none"
                       style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-primary)"/>
              </div>
              <input type="range" min="4" max="128" [ngModel]="length()" (ngModelChange)="length.set(+$event)"
                     class="w-full accent-violet-500"/>
            </div>

            <!-- Character set toggles -->
            <div class="grid grid-cols-2 gap-2 mb-4">
              @for (opt of charOpts; track opt.key) {
                <label class="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl transition-colors"
                       [style.background]="getCharOpt(opt.key) ? 'rgba(139,92,246,0.08)' : 'var(--bg-input)'"
                       [style.border]="'1px solid ' + (getCharOpt(opt.key) ? 'rgba(139,92,246,0.2)' : 'var(--border-subtle)')">
                  <input type="checkbox" [ngModel]="getCharOpt(opt.key)" (ngModelChange)="setCharOpt(opt.key, $event)"
                         class="w-4 h-4 rounded accent-violet-500 flex-shrink-0"/>
                  <div class="min-w-0">
                    <p class="text-sm font-medium" style="color:var(--text-primary)">{{ opt.label }}</p>
                    <p class="text-[11px] font-mono truncate" style="color:var(--text-muted)">{{ opt.sample }}</p>
                  </div>
                </label>
              }
            </div>

            <!-- Exclude ambiguous -->
            <label class="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl"
                   style="background:var(--bg-input);border:1px solid var(--border-subtle)">
              <input type="checkbox" [ngModel]="excludeAmbiguous()" (ngModelChange)="excludeAmbiguous.set($event)"
                     class="w-4 h-4 accent-violet-500"/>
              <div>
                <p class="text-sm font-medium" style="color:var(--text-primary)">Exclude ambiguous characters</p>
                <p class="text-[11px] font-mono" style="color:var(--text-muted)">Removes: 0 O l 1 I</p>
              </div>
            </label>
          } @else {
            <!-- Passphrase options -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2" style="color:var(--text-secondary)">Word count</label>
                <input type="range" min="3" max="10" [ngModel]="wordCount()" (ngModelChange)="wordCount.set(+$event)"
                       class="w-full accent-violet-500 mb-1"/>
                <p class="text-sm font-mono text-center" style="color:var(--text-primary)">{{ wordCount() }} words</p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2" style="color:var(--text-secondary)">Separator</label>
                <select [ngModel]="separator()" (ngModelChange)="separator.set($event)"
                        class="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                        style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-primary)">
                  @for (s of separators; track s.value) {
                    <option [value]="s.value">{{ s.label }}</option>
                  }
                </select>
              </div>
            </div>
          }
        </div>

        <!-- Generate button + count -->
        <div class="flex items-center gap-3 mb-5 flex-wrap">
          <button (click)="generate()" class="btn-primary py-2.5 px-8">Generate</button>
          <div class="flex items-center gap-2">
            <label class="text-sm" style="color:var(--text-secondary)">Count</label>
            <select [ngModel]="count()" (ngModelChange)="count.set(+$event)"
                    class="px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-primary)">
              @for (n of [1, 5, 10, 20]; track n) { <option [value]="n">{{ n }}</option> }
            </select>
          </div>
        </div>

        <!-- Results -->
        @if (results().length > 0) {
          <!-- Entropy / Strength (for password mode) -->
          @if (mode() === 'password') {
            <div class="rounded-2xl p-4 mb-4" style="background:var(--bg-card);border:1px solid var(--border-subtle)">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium" style="color:var(--text-secondary)">Entropy</span>
                <span class="text-sm font-bold" [style.color]="strength().color">
                  {{ entropyBits() }} bits — {{ strength().label }}
                </span>
              </div>
              <div class="h-1.5 rounded-full overflow-hidden" style="background:var(--border-subtle)">
                <div class="h-full rounded-full transition-all duration-500"
                     [style.width]="strength().pct + '%'"
                     [style.background]="strength().color"></div>
              </div>
              <p class="text-xs mt-2" style="color:var(--text-dim)">
                Charset: {{ charsetSize() }} characters · {{ length() }} chars long
              </p>
            </div>
          }

          <div class="panel overflow-hidden">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)">
                {{ results().length }} password{{ results().length === 1 ? '' : 's' }}
              </span>
              <button (click)="copyAll()" class="btn-icon" title="Copy all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            </div>
            @for (pwd of results(); track $index; let last = $last) {
              <div class="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                   [style.border-bottom]="last ? 'none' : '1px solid var(--border-subtle)'">
                <code class="font-mono text-sm select-all break-all" style="color:var(--output-brand)">{{ pwd }}</code>
                <button (click)="copyOne(pwd)" class="btn-icon ml-4 flex-shrink-0" title="Copy">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordGeneratorComponent {
  mode    = signal<Mode>('password');
  length  = signal(16);
  count   = signal(1);
  results = signal<string[]>([]);

  useUpper    = signal(true);
  useLower    = signal(true);
  useDigits   = signal(true);
  useSymbols  = signal(true);
  excludeAmbiguous = signal(false);

  wordCount = signal(4);
  separator = signal('-');

  readonly separators = SEPARATORS;

  charOpts = [
    { key: 'upper',   label: 'Uppercase', sample: 'A–Z' },
    { key: 'lower',   label: 'Lowercase', sample: 'a–z' },
    { key: 'digits',  label: 'Numbers',   sample: '0–9' },
    { key: 'symbols', label: 'Symbols',   sample: '!@#$%^&*' },
  ];

  getCharOpt(key: string): boolean {
    return (this as any)['use' + key.charAt(0).toUpperCase() + key.slice(1)]();
  }

  setCharOpt(key: string, v: boolean) {
    (this as any)['use' + key.charAt(0).toUpperCase() + key.slice(1)].set(v);
  }

  setLength(v: number) {
    const n = Math.max(4, Math.min(256, Number(v)));
    if (isFinite(n)) this.length.set(n);
  }

  charset = computed(() => {
    let s = '';
    if (this.useUpper())   s += CHARS.upper;
    if (this.useLower())   s += CHARS.lower;
    if (this.useDigits())  s += CHARS.digits;
    if (this.useSymbols()) s += CHARS.symbols;
    if (this.excludeAmbiguous()) s = [...s].filter((c) => !AMBIGUOUS.has(c)).join('');
    return s;
  });

  charsetSize = computed(() => this.charset().length);

  entropyBits = computed(() => entropy(this.charsetSize(), this.length()));

  strength = computed(() => strengthLabel(this.entropyBits()));

  generate() {
    const n = this.count();
    if (this.mode() === 'passphrase') {
      this.results.set(
        Array.from({ length: n }, () => generatePassphrase(this.wordCount(), this.separator())),
      );
    } else {
      const cs = this.charset();
      if (!cs) return;
      this.results.set(Array.from({ length: n }, () => generatePassword(cs, this.length())));
    }
  }

  copyOne(pwd: string) { navigator.clipboard.writeText(pwd); }
  copyAll() { navigator.clipboard.writeText(this.results().join('\n')); }
}
