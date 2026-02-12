import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConverterService } from '../../../core/services/converter.service';

type TabKey = 'xml' | 'yaml' | 'csv' | 'excel' | 'sql';

@Component({
  selector: 'app-json-converter',
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
            Data Conversion
          </p>
          <h1 class="text-3xl font-bold tracking-tight" style="color:var(--text-primary)">
            JSON Converter
          </h1>
        </div>

        <div class="tab-bar mb-6 w-fit">
          @for (t of tabs; track t.key) {
            <button
              (click)="selectTab(t.key)"
              class="tab-btn"
              [class.active]="activeTab() === t.key"
            >
              {{ t.label }}
            </button>
          }
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" style="height:520px">
          <div class="panel flex flex-col">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)"
                >JSON Input</span
              >
              <div class="flex gap-1">
                <button (click)="pasteInput()" class="btn-icon" title="Paste">
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
                <button (click)="formatJson()" class="btn-icon" title="Format">
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
                      d="M4 6h16M4 12h8m-8 6h16"
                    />
                  </svg>
                </button>
                <button
                  (click)="clearAll()"
                  class="btn-icon"
                  style="color:rgba(239,68,68,0.6)"
                  title="Clear"
                >
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
              [ngModel]="jsonInput()"
              (ngModelChange)="onInput($event)"
              class="panel-body flex-1"
              spellcheck="false"
              placeholder="Paste your JSON here..."
            ></textarea>
          </div>

          <div class="panel flex flex-col">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)"
                >{{ activeTab().toUpperCase() }} Output</span
              >
              <div class="flex gap-1">
                <button (click)="swapPanels()" class="btn-icon" title="Swap">
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
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </button>
                <button (click)="copyOutput()" class="btn-icon" title="Copy">
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <textarea
              readonly
              [value]="output()"
              class="panel-body flex-1"
              style="color:var(--output-brand)"
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        @if (error()) {
          <div
            class="mt-4 px-5 py-4 rounded-xl text-sm font-mono"
            style="color:#ef4444;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12)"
          >
            {{ error() }}
          </div>
        }
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
export class JsonConverterComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ConverterService);

  tabs = [
    { key: 'xml' as TabKey, label: 'XML' },
    { key: 'yaml' as TabKey, label: 'YAML' },
    { key: 'csv' as TabKey, label: 'CSV' },
    { key: 'excel' as TabKey, label: 'Excel' },
    { key: 'sql' as TabKey, label: 'SQL' },
  ];

  activeTab = signal<TabKey>('xml');
  jsonInput = signal('');
  output = signal('');
  error = signal('');

  constructor() {
    this.route.params.subscribe((p) => {
      const t = p['type'] as TabKey;
      if (this.tabs.some((x) => x.key === t)) {
        this.activeTab.set(t);
        this.convert();
      }
    });
  }

  selectTab(k: TabKey) {
    this.activeTab.set(k);
    this.router.navigate(['/json', k]);
    this.convert();
  }
  onInput(v: string) {
    this.jsonInput.set(v);
    this.convert();
  }

  async convert() {
    const input = this.jsonInput();
    if (!input.trim()) {
      this.output.set('');
      this.error.set('');
      return;
    }
    try {
      JSON.parse(input);
      this.error.set('');
    } catch (e: any) {
      this.error.set('Invalid JSON: ' + e.message);
      this.output.set('');
      return;
    }
    try {
      switch (this.activeTab()) {
        case 'xml':
          this.output.set(await this.svc.jsonToXml(input));
          break;
        case 'yaml':
          this.output.set(await this.svc.jsonToYaml(input));
          break;
        case 'csv':
          this.output.set(await this.svc.jsonToCsv(input));
          break;
        case 'excel':
          this.output.set(await this.svc.jsonToCsv(input));
          break;
        case 'sql':
          this.output.set(this.svc.jsonToSql(input));
          break;
      }
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  formatJson() {
    try {
      this.jsonInput.set(JSON.stringify(JSON.parse(this.jsonInput()), null, 2));
    } catch {}
  }
  swapPanels() {
    const o = this.output();
    if (o) {
      this.jsonInput.set(o);
      this.convert();
    }
  }
  async pasteInput() {
    try {
      this.jsonInput.set(await navigator.clipboard.readText());
      this.convert();
    } catch {}
  }
  copyOutput() {
    navigator.clipboard.writeText(this.output());
  }
  clearAll() {
    this.jsonInput.set('');
    this.output.set('');
    this.error.set('');
  }
}
