import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

type Fmt = 'fetch' | 'axios' | 'postman';

@Component({
  selector: 'app-curl-converter',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  template: `
    <div class="min-h-screen pt-20 pb-16">
      <div class="container mx-auto px-6 lg:px-10">
        <div class="mb-8">
          <p
            class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
            style="color:var(--gradient-from)"
          >
            API Tools
          </p>
          <h1 class="text-3xl font-bold tracking-tight" style="color:var(--text-primary)">
            cURL Converter
          </h1>
        </div>

        <div class="tab-bar mb-6 w-fit">
          <button (click)="fmt.set('fetch')" class="tab-btn" [class.active]="fmt() === 'fetch'">
            Fetch
          </button>
          <button (click)="fmt.set('axios')" class="tab-btn" [class.active]="fmt() === 'axios'">
            Axios
          </button>
          <button (click)="fmt.set('postman')" class="tab-btn" [class.active]="fmt() === 'postman'">
            Postman
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" style="height:520px">
          <div class="panel flex flex-col">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)"
                >cURL Command</span
              >
              <div class="flex gap-1">
                <button (click)="paste()" class="btn-icon" title="Paste">
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
                <button
                  (click)="loadSample()"
                  class="btn-icon text-xs font-medium"
                  style="color:var(--gradient-from)"
                >
                  Sample
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
              placeholder="Paste your cURL command here..."
            ></textarea>
          </div>
          <div class="panel flex flex-col">
            <div class="panel-toolbar">
              <span class="text-sm font-semibold" style="color:var(--text-secondary)"
                >{{ fmt() | titlecase }} Output</span
              >
              <button (click)="copy()" class="btn-icon" title="Copy">
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
            <textarea
              readonly
              [value]="outputResult().output"
              class="panel-body flex-1"
              style="color:var(--output-gold)"
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        @if (outputResult().error) {
          <div
            class="mt-4 px-5 py-4 rounded-xl text-sm font-mono"
            style="color:#ef4444;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12)"
          >
            {{ outputResult().error }}
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
export class CurlConverterComponent {
  input = signal('');
  fmt = signal<Fmt>('fetch');

  // Computed derivation for automatic updates
  outputResult = computed(() => {
    const raw = this.input().trim();
    if (!raw) return { output: '', error: '' };

    try {
      const p = this.parse(raw);
      let out = '';
      switch (this.fmt()) {
        case 'fetch':
          out = this.toFetch(p);
          break;
        case 'axios':
          out = this.toAxios(p);
          break;
        case 'postman':
          out = this.toPostman(p);
          break;
      }
      return { output: out, error: '' };
    } catch (e: any) {
      return { output: '', error: e.message || 'Could not parse cURL' };
    }
  });

  loadSample() {
    this.input.set(
      'curl -X POST https://api.example.com/users \\\n  -H "Content-Type: application/json" \\\n  -H Authorization:Bearer_token123 \\\n  --data-raw \'{"name": "John", "email": "john@example.com"}\'',
    );
  }

  parse(raw: string): {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  } {
    // 1. Tokenize respecting quotes
    const tokens: string[] = [];
    let current = '';
    let quote: string | null = null;
    let escape = false;

    // Normalize newlines
    const s = raw.replace(/\\\n/g, ' ').replace(/[\r\n]+/g, ' ');

    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      if (escape) {
        current += char;
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (quote) {
        if (char === quote) {
          quote = null;
        } else {
          current += char;
        }
      } else {
        if (char === '"' || char === "'") {
          quote = char;
        } else if (char === ' ') {
          if (current) tokens.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }
    if (current) tokens.push(current);

    // 2. Parse tokens
    let method = 'GET';
    let url = '';
    const headers: Record<string, string> = {};
    let body: string | undefined;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.startsWith('http')) {
        url = t;
        continue;
      }
      if (t === '-X' || t === '--request') {
        method = tokens[++i]?.toUpperCase() || 'GET';
      } else if (t === '-H' || t === '--header') {
        const h = tokens[++i];
        if (h) {
          const firstColon = h.indexOf(':');
          if (firstColon > -1) {
            const k = h.substring(0, firstColon).trim();
            const v = h.substring(firstColon + 1).trim();
            headers[k] = v;
          }
        }
      } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
        body = tokens[++i];
        if (method === 'GET' && body) method = 'POST';
      } else if (t === '--compressed') {
        headers['Accept-Encoding'] = 'gzip, deflate, br';
      }
    }

    if (!url) {
      // Try to find URL again if missed (sometimes it's just a positional arg)
      const found = tokens.find((t) => t.startsWith('http'));
      if (found) url = found;
      // Make forgiving - if no URL, maybe it's just partial. But for now error is ok.
      if (!url) throw new Error('No URL found');
    }

    return { method, url, headers, body };
  }

  toFetch(p: any): string {
    let c = 'const response = await fetch("' + p.url + '", {\n  method: "' + p.method + '"';
    if (Object.keys(p.headers).length)
      c += ',\n  headers: ' + JSON.stringify(p.headers, null, 4).replace(/\n/g, '\n  ');
    if (p.body) {
      try {
        // Try to format JSON body if possible
        const jsonBody = JSON.parse(p.body);
        c +=
          ',\n  body: JSON.stringify(' +
          JSON.stringify(jsonBody, null, 4).replace(/\n/g, '\n  ') +
          ')';
      } catch {
        c += ',\n  body: ' + JSON.stringify(p.body);
      }
    }
    return c + '\n});\n\nconst data = await response.json();\nconsole.log(data);';
  }
  toAxios(p: any): string {
    let c =
      'const response = await axios({\n  method: "' +
      p.method.toLowerCase() +
      '",\n  url: "' +
      p.url +
      '"';
    if (Object.keys(p.headers).length)
      c += ',\n  headers: ' + JSON.stringify(p.headers, null, 4).replace(/\n/g, '\n  ');
    if (p.body) {
      try {
        const jsonBody = JSON.parse(p.body);
        c += ',\n  data: ' + JSON.stringify(jsonBody, null, 4).replace(/\n/g, '\n  ');
      } catch {
        c += ',\n  data: ' + JSON.stringify(p.body);
      }
    }
    return c + '\n});\n\nconsole.log(response.data);';
  }
  toPostman(p: any): string {
    const pm: any = {
      info: {
        name: 'Converted from cURL',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: p.url,
          request: {
            method: p.method,
            header: Object.entries(p.headers).map(([k, v]) => ({ key: k, value: v })),
            url: { raw: p.url },
          },
        },
      ],
    };
    if (p.body) {
      try {
        pm.item[0].request.body = { mode: 'raw', raw: JSON.stringify(JSON.parse(p.body), null, 2) };
      } catch {
        pm.item[0].request.body = { mode: 'raw', raw: p.body };
      }
    }
    return JSON.stringify(pm, null, 2);
  }

  async paste() {
    try {
      this.input.set(await navigator.clipboard.readText());
    } catch {}
  }
  copy() {
    navigator.clipboard.writeText(this.outputResult().output);
  }
}
