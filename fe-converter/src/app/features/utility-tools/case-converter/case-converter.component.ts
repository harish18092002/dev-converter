import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-case-converter',
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
            Text Utilities
          </p>
          <h1 class="text-3xl font-bold tracking-tight" style="color:var(--text-primary)">
            Case Converter
          </h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="panel flex flex-col" style="height:240px">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)"
                >Input Text</span
              >
              <div class="flex gap-1">
                <button (click)="pasteClip()" class="btn-icon" title="Paste">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </button>
                <button (click)="input.set('')" class="btn-icon" style="color:rgba(239,68,68,0.6)">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <textarea
              [ngModel]="input()"
              (ngModelChange)="input.set($event)"
              class="panel-body flex-1"
              spellcheck="false"
              placeholder="Type or paste your text here..."
            ></textarea>
          </div>

          <div class="space-y-2">
            @for (r of results(); track r.label) {
              <button
                (click)="copy(r.value)"
                class="w-full text-left glass-hover rounded-xl px-5 py-3.5 flex items-center justify-between"
              >
                <div class="min-w-0 mr-4">
                  <p
                    class="text-[10px] uppercase tracking-[0.12em] mb-0.5"
                    style="color:var(--text-dim)"
                  >
                    {{ r.label }}
                  </p>
                  <p class="font-mono text-sm truncate" style="color:var(--output-brand)">
                    {{ r.value }}
                  </p>
                </div>
                <span
                  class="text-[10px] whitespace-nowrap font-medium"
                  style="color:var(--text-dim)"
                  >Copy</span
                >
              </button>
            }
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseConverterComponent {
  input = signal('Hello World Example');

  results = computed(() => {
    const t = this.input();
    if (!t) return [];
    return [
      { label: 'camelCase', value: this.toCamel(t) },
      { label: 'PascalCase', value: this.toPascal(t) },
      { label: 'snake_case', value: this.toSnake(t) },
      { label: 'kebab-case', value: this.toKebab(t) },
      { label: 'CONSTANT_CASE', value: this.toSnake(t).toUpperCase() },
      { label: 'lowercase', value: t.toLowerCase() },
      { label: 'UPPERCASE', value: t.toUpperCase() },
      { label: 'Sentence case', value: t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() },
      { label: 'dot.case', value: this.toSnake(t).replace(/_/g, '.') },
      { label: 'path/case', value: this.toSnake(t).replace(/_/g, '/') },
    ];
  });

  private words(s: string): string[] {
    return s.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g) || [s];
  }
  toCamel(s: string) {
    const w = this.words(s);
    return w
      .map((x, i) =>
        i === 0 ? x.toLowerCase() : x.charAt(0).toUpperCase() + x.slice(1).toLowerCase(),
      )
      .join('');
  }
  toPascal(s: string) {
    return this.words(s)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  }
  toSnake(s: string) {
    return this.words(s)
      .map((w) => w.toLowerCase())
      .join('_');
  }
  toKebab(s: string) {
    return this.words(s)
      .map((w) => w.toLowerCase())
      .join('-');
  }

  copy(v: string) {
    navigator.clipboard.writeText(v);
  }
  async pasteClip() {
    try {
      this.input.set(await navigator.clipboard.readText());
    } catch {}
  }
}
