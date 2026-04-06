import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

type UidType = 'v4' | 'v7' | 'ulid';

// ─── UUID v4 ────────────────────────────────────────────────────────────────
function uuidV4(): string {
  return crypto.randomUUID();
}

// ─── UUID v7 (RFC 9562) ─────────────────────────────────────────────────────
// Layout: unix_ts_ms(48) | ver(4)=7 | rand_a(12) | var(2)=10 | rand_b(62)
function uuidV7(): string {
  const now = BigInt(Date.now());
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const view = new DataView(bytes.buffer);
  // Bytes 0–5: 48-bit timestamp (big-endian)
  view.setUint32(0, Number(now >> 16n));
  view.setUint16(4, Number(now & 0xffffn));
  // Byte 6: version 7 in top nibble
  bytes[6] = (0x70 | (bytes[6] & 0x0f));
  // Byte 8: variant 10xx xxxx
  bytes[8] = (0x80 | (bytes[8] & 0x3f));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

// ─── ULID ────────────────────────────────────────────────────────────────────
// Structure: timestamp(10 chars) + random(16 chars), Crockford Base32
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(ms: number): string {
  let t = ms;
  let s = '';
  for (let i = 9; i >= 0; i--) {
    s = CROCKFORD[t % 32] + s;
    t = Math.floor(t / 32);
  }
  return s;
}

function encodeRandom(): string {
  // 80 bits = 10 bytes; 16 Crockford chars (5 bits each)
  const buf = crypto.getRandomValues(new Uint8Array(10));
  let bits = 0n;
  for (const b of buf) bits = (bits << 8n) | BigInt(b);
  let s = '';
  for (let i = 15; i >= 0; i--) {
    s = CROCKFORD[Number(bits & 31n)] + s;
    bits >>= 5n;
  }
  return s;
}

function generateUlid(): string {
  return encodeTime(Date.now()) + encodeRandom();
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
function generate(type: UidType): string {
  switch (type) {
    case 'v4':   return uuidV4();
    case 'v7':   return uuidV7();
    case 'ulid': return generateUlid();
  }
}

const TYPE_META: Record<UidType, { label: string; desc: string; example: string }> = {
  v4: {
    label: 'UUID v4',
    desc: '128-bit random. The most widely used UUID format — all bits are random.',
    example: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
  },
  v7: {
    label: 'UUID v7',
    desc: 'Time-ordered. Embeds a 48-bit millisecond timestamp for database-friendly sorting.',
    example: 'tttttttt-tttt-7xxx-yxxx-xxxxxxxxxxxx',
  },
  ulid: {
    label: 'ULID',
    desc: 'Universally Unique Lexicographically Sortable Identifier. Crockford Base32, URL-safe, monotonic.',
    example: 'TTTTTTTTTTRRRRRRRRRRRRRRR',
  },
};

@Component({
  selector: 'app-uuid-generator',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen" style="padding: 80px 0 64px">
      <div class="container mx-auto px-6 lg:px-10 max-w-3xl">

        <div class="tool-page-header">
          <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
             style="color:var(--gradient-from)">Generate</p>
          <h1 class="text-3xl font-bold tracking-tight mb-1" style="color:var(--text-primary)">
            UUID / ULID Generator
          </h1>
          <p class="text-sm" style="color:var(--text-muted)">
            Cryptographically secure identifiers — generated entirely in your browser.
          </p>
        </div>

        <!-- Type selector -->
        <div class="tab-bar my-6 w-fit">
          @for (t of typeOptions; track t.value) {
            <button class="tab-btn" [class.active]="mode() === t.value" (click)="setMode(t.value)">
              {{ t.label }}
            </button>
          }
        </div>

        <!-- Type info card -->
        <div class="rounded-2xl p-5 mb-6" style="background:var(--bg-card);border:1px solid var(--border-subtle)">
          <p class="text-sm mb-2" style="color:var(--text-secondary)">{{ currentMeta().desc }}</p>
          <code class="text-xs font-mono" style="color:var(--text-muted)">{{ currentMeta().example }}</code>
        </div>

        <!-- Controls row -->
        <div class="flex items-center gap-4 mb-6 flex-wrap">
          <div class="flex items-center gap-3">
            <label class="text-sm font-medium" style="color:var(--text-secondary)">Count</label>
            <input type="range" min="1" max="100" [ngModel]="count()" (ngModelChange)="count.set($event)"
                   class="w-32 accent-violet-500"/>
            <span class="text-sm font-mono w-8 text-right" style="color:var(--text-primary)">{{ count() }}</span>
          </div>

          <button (click)="generateAll()" class="btn-primary py-2.5 px-6 text-sm">
            Generate
          </button>

          @if (results().length > 0) {
            <button (click)="copyAll()" class="btn-secondary py-2.5 px-4 text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Copy All
            </button>

            <button (click)="results.set([])" class="btn-icon" style="color:rgba(239,68,68,0.6)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          }
        </div>

        <!-- Results list -->
        @if (results().length === 0) {
          <div class="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
               style="background:var(--bg-card);border:1px dashed var(--border-subtle)">
            <div class="text-4xl mb-3 opacity-40">🔑</div>
            <p class="text-sm" style="color:var(--text-muted)">Click Generate to create identifiers</p>
          </div>
        } @else {
          <div class="panel overflow-hidden">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)">
                {{ results().length }} {{ currentMeta().label }}{{ results().length === 1 ? '' : 's' }}
              </span>
              <button (click)="generateAll()" class="btn-icon" title="Regenerate">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
            <div class="overflow-y-auto" style="max-height: 480px">
              @for (id of results(); track $index; let last = $last) {
                <div class="flex items-center justify-between px-5 py-3 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                     [style.border-bottom]="last ? 'none' : '1px solid var(--border-subtle)'">
                  <code class="font-mono text-sm select-all" style="color:var(--output-brand)">{{ id }}</code>
                  <button (click)="copyOne(id)" class="btn-icon ml-4 flex-shrink-0" title="Copy">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UuidGeneratorComponent {
  mode  = signal<UidType>('v4');
  count = signal(1);
  results = signal<string[]>([]);

  typeOptions: { label: string; value: UidType }[] = [
    { label: 'UUID v4', value: 'v4' },
    { label: 'UUID v7', value: 'v7' },
    { label: 'ULID', value: 'ulid' },
  ];

  currentMeta() {
    return TYPE_META[this.mode()];
  }

  setMode(t: UidType) {
    this.mode.set(t);
    this.results.set([]);
  }

  generateAll() {
    const type = this.mode();
    const n    = this.count();
    const ids: string[] = [];
    for (let i = 0; i < n; i++) ids.push(generate(type));
    this.results.set(ids);
  }

  copyOne(id: string) {
    navigator.clipboard.writeText(id);
  }

  copyAll() {
    navigator.clipboard.writeText(this.results().join('\n'));
  }
}
