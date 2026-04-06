import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParsedUrl {
  protocol:  string;
  username:  string;
  password:  string;
  hostname:  string;
  port:      string;
  pathname:  string;
  search:    string;
  hash:      string;
  origin:    string;
  href:      string;
  params:    { key: string; value: string }[];
}

interface BuilderParam { key: string; value: string }

type Tab = 'parse' | 'encode' | 'builder';

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Attempt to parse a URL string, auto-prepending https:// when missing */
function tryParseUrl(raw: string): ParsedUrl | null {
  const s = raw.trim();
  if (!s) return null;
  let href = s;
  // Prepend scheme only if none present (allows domain-only input)
  if (!/^[a-z][a-z0-9+\-.]*:\/\//i.test(s)) {
    href = 'https://' + s;
  }
  try {
    const u = new URL(href);
    const params: { key: string; value: string }[] = [];
    u.searchParams.forEach((v, k) => params.push({ key: k, value: v }));
    return {
      protocol: u.protocol,
      username: u.username,
      password: u.password,
      hostname: u.hostname,
      port:     u.port,
      pathname: u.pathname,
      search:   u.search,
      hash:     u.hash,
      origin:   u.origin,
      href:     u.href,
      params,
    };
  } catch {
    return null;
  }
}

const COMPONENT_LABELS: { key: keyof ParsedUrl; label: string; mono: boolean }[] = [
  { key: 'href',     label: 'Full URL',  mono: true  },
  { key: 'origin',   label: 'Origin',    mono: true  },
  { key: 'protocol', label: 'Protocol',  mono: true  },
  { key: 'hostname', label: 'Hostname',  mono: true  },
  { key: 'port',     label: 'Port',      mono: true  },
  { key: 'pathname', label: 'Path',      mono: true  },
  { key: 'search',   label: 'Query',     mono: true  },
  { key: 'hash',     label: 'Fragment',  mono: true  },
  { key: 'username', label: 'Username',  mono: false },
  { key: 'password', label: 'Password',  mono: false },
];

@Component({
  selector: 'app-url-parser',
  imports: [FormsModule],
  template: `
    <div class="tool-page-content">
      <div class="tool-page-header">
        <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
           style="color:var(--gradient-from)">Network Tools</p>
        <h1 class="text-3xl font-bold tracking-tight" style="color:var(--text-primary)">URL Parser &amp; Encoder</h1>
      </div>

      <div class="tool-page-controls">
        <div class="tab-bar">
          <button class="tab-btn" [class.active]="tab() === 'parse'"   (click)="tab.set('parse')">Parser</button>
          <button class="tab-btn" [class.active]="tab() === 'encode'"  (click)="tab.set('encode')">Encode / Decode</button>
          <button class="tab-btn" [class.active]="tab() === 'builder'" (click)="tab.set('builder')">Query Builder</button>
        </div>
      </div>

      <!-- ══ PARSER TAB ══ -->
      @if (tab() === 'parse') {
        <div class="tool-page-split">
          <!-- Left: URL input -->
          <div class="panel flex flex-col min-h-0">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)">URL Input</span>
              <div class="flex gap-1">
                <button (click)="pasteUrl()" class="btn-icon" title="Paste">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </button>
                <button (click)="urlInput.set('')" class="btn-icon" title="Clear" style="color:rgba(239,68,68,0.6)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
            <textarea [ngModel]="urlInput()" (ngModelChange)="urlInput.set($event)"
                      class="panel-body flex-1 min-h-0"
                      spellcheck="false"
                      placeholder="https://example.com/path?foo=bar&baz=qux#section"></textarea>
            @if (urlInput().trim() && !parsedUrl()) {
              <div class="flex-shrink-0 px-5 py-2.5 text-xs font-mono"
                   style="border-top:1px solid var(--border-subtle);color:#ef4444">
                Invalid URL
              </div>
            }
          </div>

          <!-- Right: decomposed view -->
          <div class="panel flex flex-col min-h-0 overflow-hidden">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)">Components</span>
            </div>
            <div class="flex-1 overflow-y-auto">
              @if (!parsedUrl()) {
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                  <div class="text-4xl mb-3 opacity-30">🔗</div>
                  <p class="text-sm" style="color:var(--text-muted)">Paste a URL on the left to decompose it.</p>
                </div>
              } @else {
                <!-- URL component rows -->
                @for (comp of componentRows(); track comp.key) {
                  @if (comp.value) {
                    <div class="px-5 py-3.5 flex items-start gap-4 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                         style="border-bottom:1px solid var(--border-subtle)">
                      <span class="text-[11px] uppercase tracking-wider font-semibold w-20 flex-shrink-0 mt-0.5"
                            style="color:var(--text-muted)">{{ comp.label }}</span>
                      <code class="flex-1 text-sm font-mono break-all" style="color:var(--text-primary)">{{ comp.value }}</code>
                      <button (click)="copy(comp.value)" class="btn-icon flex-shrink-0" title="Copy">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                      </button>
                    </div>
                  }
                }

                <!-- Query parameters table -->
                @if (parsedUrl()!.params.length > 0) {
                  <div class="px-5 py-4">
                    <p class="text-[11px] uppercase tracking-wider font-semibold mb-3" style="color:var(--text-muted)">
                      Query Parameters ({{ parsedUrl()!.params.length }})
                    </p>
                    <div class="rounded-xl overflow-hidden" style="border:1px solid var(--border-subtle)">
                      @for (p of parsedUrl()!.params; track $index; let last = $last) {
                        <div class="flex items-center gap-3 px-4 py-2.5 text-sm"
                             [style.border-bottom]="last ? 'none' : '1px solid var(--border-subtle)'">
                          <code class="font-mono font-medium w-1/3 truncate" style="color:var(--gradient-from)">{{ p.key }}</code>
                          <code class="font-mono flex-1 truncate" style="color:var(--text-secondary)">{{ p.value }}</code>
                          <button (click)="copy(p.value)" class="btn-icon" title="Copy value">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      }

      <!-- ══ ENCODE / DECODE TAB ══ -->
      @if (tab() === 'encode') {
        <div class="tool-page-split">
          <!-- Left: raw input -->
          <div class="panel flex flex-col min-h-0">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)">Raw / Decoded</span>
              <div class="flex gap-1">
                <button (click)="pasteEncode()" class="btn-icon" title="Paste">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </button>
                <button (click)="encodeInput.set('')" class="btn-icon" title="Clear" style="color:rgba(239,68,68,0.6)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
            <textarea [ngModel]="encodeInput()" (ngModelChange)="encodeInput.set($event)"
                      class="panel-body flex-1 min-h-0"
                      spellcheck="false"
                      placeholder="hello world &amp; foo=bar"></textarea>
          </div>
          <!-- Right: encoded output -->
          <div class="panel flex flex-col min-h-0">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)">Percent-Encoded</span>
              <button (click)="copy(encoded())" class="btn-icon" title="Copy">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            </div>
            <textarea readonly [value]="encoded()"
                      class="panel-body flex-1 min-h-0"
                      style="color:var(--output-brand)"
                      spellcheck="false"></textarea>
          </div>
        </div>
      }

      <!-- ══ QUERY BUILDER TAB ══ -->
      @if (tab() === 'builder') {
        <div class="tool-page-split">
          <!-- Left: base URL + param editor -->
          <div class="panel flex flex-col min-h-0">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)">Base URL &amp; Parameters</span>
              <button (click)="addParam()" class="btn-icon" title="Add parameter"
                      style="color:var(--gradient-from)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-5 space-y-3">
              <input [ngModel]="builderBase()" (ngModelChange)="builderBase.set($event)"
                     type="text" placeholder="https://api.example.com/endpoint"
                     class="w-full px-4 py-2.5 rounded-xl font-mono text-sm focus:outline-none"
                     style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-primary)"/>

              <p class="text-[11px] uppercase tracking-wider font-semibold pt-2" style="color:var(--text-muted)">
                Query Parameters
              </p>

              @for (p of builderParams(); track $index) {
                <div class="flex items-center gap-2">
                  <input [ngModel]="p.key" (ngModelChange)="updateParam($index, 'key', $event)"
                         type="text" placeholder="key"
                         class="flex-1 px-3 py-2 rounded-lg font-mono text-sm focus:outline-none"
                         style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--gradient-from)"/>
                  <input [ngModel]="p.value" (ngModelChange)="updateParam($index, 'value', $event)"
                         type="text" placeholder="value"
                         class="flex-1 px-3 py-2 rounded-lg font-mono text-sm focus:outline-none"
                         style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-primary)"/>
                  <button (click)="removeParam($index)" class="btn-icon flex-shrink-0"
                          style="color:rgba(239,68,68,0.6)" title="Remove">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          </div>
          <!-- Right: built URL -->
          <div class="panel flex flex-col min-h-0">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)">Built URL</span>
              <button (click)="copy(builtUrl())" class="btn-icon" title="Copy">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            </div>
            <textarea readonly [value]="builtUrl()"
                      class="panel-body flex-1 min-h-0"
                      style="color:var(--output-brand)"
                      spellcheck="false"></textarea>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }
      @media (max-width: 1024px) {
        :host { height: auto; overflow: visible; }
        .tool-page-split { grid-template-columns: 1fr !important; }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlParserComponent {
  tab = signal<Tab>('parse');

  // ── Parser tab ────────────────────────────────────────────────────────────
  urlInput = signal('');

  parsedUrl = computed(() => tryParseUrl(this.urlInput()));

  componentRows = computed(() => {
    const u = this.parsedUrl();
    if (!u) return [];
    return COMPONENT_LABELS.map((c) => ({
      key:   c.key,
      label: c.label,
      mono:  c.mono,
      value: String(u[c.key] ?? ''),
    })).filter((r) => r.value && r.value !== 'null');
  });

  async pasteUrl() {
    try { this.urlInput.set(await navigator.clipboard.readText()); } catch {}
  }

  // ── Encode/Decode tab ─────────────────────────────────────────────────────
  encodeInput = signal('');

  encoded = computed(() => {
    const s = this.encodeInput();
    try { return encodeURIComponent(s); } catch { return ''; }
  });

  async pasteEncode() {
    try { this.encodeInput.set(await navigator.clipboard.readText()); } catch {}
  }

  // ── Query Builder tab ──────────────────────────────────────────────────────
  builderBase   = signal('https://api.example.com/endpoint');
  builderParams = signal<BuilderParam[]>([
    { key: '', value: '' },
  ]);

  builtUrl = computed(() => {
    const base   = this.builderBase().trim();
    const params = this.builderParams().filter((p) => p.key.trim());
    if (!params.length) return base;
    const qs = params
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}${qs}`;
  });

  addParam() {
    this.builderParams.update((ps) => [...ps, { key: '', value: '' }]);
  }

  removeParam(i: number) {
    this.builderParams.update((ps) => ps.filter((_, idx) => idx !== i));
  }

  updateParam(i: number, field: 'key' | 'value', val: string) {
    this.builderParams.update((ps) =>
      ps.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)),
    );
  }

  // ── Shared ────────────────────────────────────────────────────────────────
  copy(text: string) {
    navigator.clipboard.writeText(text);
  }
}
