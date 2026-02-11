import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-converter',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen pt-20 pb-16">
      <div class="container mx-auto px-6 lg:px-10">
        <div class="mb-8">
          <p
            class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
            style="color:var(--gradient-from)"
          >
            Utilities
          </p>
          <h1 class="text-3xl font-bold tracking-tight" style="color:var(--text-primary)">
            DateTime Toolkit
          </h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="glass rounded-2xl p-7">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-semibold text-[15px]" style="color:var(--text-primary)">
                Timestamp &harr; Date
              </h3>
              <button
                (click)="setNow()"
                class="text-xs font-bold transition-colors"
                style="color:var(--gradient-from)"
              >
                Now
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label
                  class="block text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5"
                  style="color:var(--text-muted)"
                  >Unix Timestamp (ms)</label
                >
                <input
                  type="number"
                  [ngModel]="timestamp()"
                  (ngModelChange)="fromTs($event)"
                  class="themed-input"
                />
              </div>
              <div>
                <label
                  class="block text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5"
                  style="color:var(--text-muted)"
                  >ISO 8601</label
                >
                <input
                  type="text"
                  [ngModel]="iso()"
                  (ngModelChange)="fromIso($event)"
                  class="themed-input"
                />
              </div>
              <div
                class="p-4 rounded-xl space-y-3"
                style="background:var(--bg-toolbar);border:1px solid var(--border-subtle)"
              >
                <div class="flex justify-between">
                  <span class="text-[10px] uppercase tracking-wider" style="color:var(--text-muted)"
                    >Local</span
                  ><span class="text-sm font-mono" style="color:var(--text-primary)">{{
                    local()
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[10px] uppercase tracking-wider" style="color:var(--text-muted)"
                    >UTC</span
                  ><span class="text-sm font-mono" style="color:var(--text-primary)">{{
                    utc()
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[10px] uppercase tracking-wider" style="color:var(--text-muted)"
                    >Relative</span
                  ><span class="text-sm font-mono" style="color:var(--gradient-from)">{{
                    relative()
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="glass rounded-2xl p-7">
            <h3 class="font-semibold text-[15px] mb-6" style="color:var(--text-primary)">
              Time Unit Converter
            </h3>
            <div class="grid grid-cols-2 gap-4">
              @for (u of units; track u.key) {
                <div>
                  <label
                    class="block text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5"
                    style="color:var(--text-muted)"
                    >{{ u.label }}</label
                  >
                  <input
                    type="number"
                    [ngModel]="getVal(u.key)"
                    (ngModelChange)="setUnit($event, u.key)"
                    class="themed-input"
                  />
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .themed-input {
        width: 100%;
        background: var(--bg-input);
        border: 1px solid var(--border-subtle);
        border-radius: 12px;
        padding: 10px 16px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        color: var(--text-primary);
        transition: border-color 0.3s;
      }
      .themed-input:focus {
        outline: none;
        border-color: var(--border-hover);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateConverterComponent {
  timestamp = signal(Date.now());
  iso = signal(new Date().toISOString());

  local = computed(() => {
    try {
      return new Date(this.timestamp()).toString();
    } catch {
      return 'Invalid';
    }
  });
  utc = computed(() => {
    try {
      return new Date(this.timestamp()).toUTCString();
    } catch {
      return 'Invalid';
    }
  });
  relative = computed(() => {
    const diff = Date.now() - this.timestamp();
    const a = Math.abs(diff);
    const s = diff > 0 ? 'ago' : 'from now';
    const sec = Math.floor(a / 1000);
    if (sec < 60) return sec + 's ' + s;
    if (sec < 3600) return Math.floor(sec / 60) + 'm ' + s;
    if (sec < 86400) return Math.floor(sec / 3600) + 'h ' + s;
    return Math.floor(sec / 86400) + 'd ' + s;
  });

  setNow() {
    const n = Date.now();
    this.timestamp.set(n);
    this.iso.set(new Date(n).toISOString());
  }
  fromTs(v: number) {
    let ms = v < 1e12 ? v * 1000 : v;
    this.timestamp.set(ms);
    try {
      this.iso.set(new Date(ms).toISOString());
    } catch {}
  }
  fromIso(v: string) {
    this.iso.set(v);
    try {
      const d = new Date(v);
      if (!isNaN(d.getTime())) this.timestamp.set(d.getTime());
    } catch {}
  }

  units = [
    { key: 'ms', label: 'Milliseconds' },
    { key: 'sec', label: 'Seconds' },
    { key: 'min', label: 'Minutes' },
    { key: 'hour', label: 'Hours' },
    { key: 'day', label: 'Days' },
    { key: 'week', label: 'Weeks' },
    { key: 'month', label: 'Months (30d)' },
    { key: 'year', label: 'Years (365d)' },
  ];
  ms = signal(0);
  sec = signal(0);
  min = signal(0);
  hour = signal(0);
  day = signal(0);
  week = signal(0);
  month = signal(0);
  year = signal(0);

  getVal(k: string): number {
    return (this as any)[k]();
  }
  setUnit(v: number, k: string) {
    const m: Record<string, number> = {
      ms: 1,
      sec: 1000,
      min: 60000,
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000, // 30 days
      year: 31536000000, // 365 days
    };
    const base = v * (m[k] || 1);

    this.ms.set(+base.toFixed(0));
    this.sec.set(+(base / m['sec']).toFixed(3));
    this.min.set(+(base / m['min']).toFixed(3));
    this.hour.set(+(base / m['hour']).toFixed(3));
    this.day.set(+(base / m['day']).toFixed(3));
    this.week.set(+(base / m['week']).toFixed(3));
    this.month.set(+(base / m['month']).toFixed(3));
    this.year.set(+(base / m['year']).toFixed(3));
  }
}
