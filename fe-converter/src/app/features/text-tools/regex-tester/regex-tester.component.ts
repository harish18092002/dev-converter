import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RegexMatch {
  index:  number;
  value:  string;
  groups: string[];
  namedGroups: Record<string, string> | null;
}

interface RegexResult {
  ok:      true;
  matches: RegexMatch[];
  flags:   string;
}

interface RegexError {
  ok:    false;
  error: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
/** Minimal HTML escaping — only escapes characters that break markup */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Build highlighted HTML from match positions.
 * Preserves whitespace via `white-space: pre-wrap`.
 */
function buildHighlight(text: string, matches: RegexMatch[]): string {
  if (!matches.length) return esc(text);
  // Deduplicate overlapping / zero-length matches
  const sorted = [...matches].sort((a, b) => a.index - b.index);
  let result = '';
  let cursor = 0;

  for (const m of sorted) {
    if (m.index < cursor) continue; // skip overlapping
    result += esc(text.slice(cursor, m.index));
    const matchHtml = esc(m.value) || '&#8203;'; // zero-width-space for empty match
    result += `<mark class="regex-match">${matchHtml}</mark>`;
    cursor = m.index + Math.max(m.value.length, 1);
  }
  result += esc(text.slice(cursor));
  return result;
}

/** Execute a regex against text and collect all matches */
function runRegex(pattern: string, flagStr: string, text: string): RegexResult | RegexError {
  if (!pattern) return { ok: true, matches: [], flags: flagStr };
  try {
    // Always force 'd' flag (hasIndices) if supported for named groups
    const re = new RegExp(pattern, flagStr);
    const matches: RegexMatch[] = [];

    if (flagStr.includes('g')) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(text)) !== null && guard++ < 5000) {
        matches.push({
          index:       m.index,
          value:       m[0],
          groups:      m.slice(1).map((g) => g ?? ''),
          namedGroups: m.groups ? { ...m.groups } : null,
        });
        // Prevent infinite loop on zero-length match
        if (m[0].length === 0) re.lastIndex++;
      }
    } else {
      const m = re.exec(text);
      if (m) {
        matches.push({
          index:       m.index,
          value:       m[0],
          groups:      m.slice(1).map((g) => g ?? ''),
          namedGroups: m.groups ? { ...m.groups } : null,
        });
      }
    }
    return { ok: true, matches, flags: flagStr };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

interface FlagDef {
  key:   string;
  label: string;
  desc:  string;
}

const FLAG_DEFS: FlagDef[] = [
  { key: 'g', label: 'g', desc: 'Global — find all matches'          },
  { key: 'i', label: 'i', desc: 'Ignore case'                        },
  { key: 'm', label: 'm', desc: 'Multiline — ^ and $ match line ends' },
  { key: 's', label: 's', desc: 'DotAll — dot matches newlines'       },
  { key: 'u', label: 'u', desc: 'Unicode mode'                        },
];

type Tab = 'test' | 'replace';

@Component({
  selector: 'app-regex-tester',
  imports: [FormsModule],
  template: `
    <div class="tool-page-content">
      <div class="tool-page-header">
        <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
           style="color:var(--gradient-from)">Text Tools</p>
        <h1 class="text-3xl font-bold tracking-tight" style="color:var(--text-primary)">Regex Tester</h1>
      </div>

      <!-- Pattern + flags row -->
      <div class="tool-page-controls">
        <div class="flex-1 min-w-0 flex items-center gap-2 rounded-xl px-4 py-2.5"
             style="background:var(--bg-input);border:1px solid var(--border-subtle)"
             [style.border-color]="result() && !result()!.ok ? '#ef4444' : undefined">
          <span class="text-lg font-mono select-none flex-shrink-0" style="color:var(--text-muted)">/</span>
          <input [ngModel]="pattern()" (ngModelChange)="pattern.set($event)"
                 type="text" spellcheck="false" placeholder="Enter regular expression…"
                 class="flex-1 bg-transparent focus:outline-none font-mono text-sm"
                 style="color:var(--text-primary)"/>
          <span class="text-lg font-mono select-none flex-shrink-0" style="color:var(--text-muted)">/</span>
          <div class="flex items-center gap-1 ml-1">
            @for (f of flagDefs; track f.key) {
              <button (click)="toggleFlag(f.key)"
                      class="w-7 h-7 rounded-md text-xs font-mono font-bold transition-all duration-200"
                      [title]="f.desc"
                      [style.background]="flags()[f.key] ? 'rgba(139,92,246,0.3)' : 'transparent'"
                      [style.color]="flags()[f.key] ? '#a78bfa' : 'var(--text-muted)'">
                {{ f.key }}
              </button>
            }
          </div>
        </div>

        <div class="tab-bar">
          <button class="tab-btn" [class.active]="activeTab() === 'test'"    (click)="activeTab.set('test')">Test</button>
          <button class="tab-btn" [class.active]="activeTab() === 'replace'" (click)="activeTab.set('replace')">Replace</button>
        </div>
      </div>

      <!-- Error bar -->
      @if (result() && !result()!.ok) {
        <div class="flex-shrink-0 mb-3 px-4 py-2.5 rounded-xl text-sm font-mono"
             style="color:#ef4444;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12)">
          {{ getError() }}
        </div>
      }

      <!-- Replace input (shown in replace mode) -->
      @if (activeTab() === 'replace') {
        <div class="flex-shrink-0 mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5"
             style="background:var(--bg-input);border:1px solid var(--border-subtle)">
          <span class="text-xs font-mono select-none text-nowrap" style="color:var(--text-muted)">Replace with</span>
          <input [ngModel]="replacement()" (ngModelChange)="replacement.set($event)"
                 type="text" spellcheck="false" placeholder="Replacement (use $1, $2 for groups)…"
                 class="flex-1 bg-transparent focus:outline-none font-mono text-sm"
                 style="color:var(--text-primary)"/>
        </div>
      }

      <div class="tool-page-split">
        <!-- ── Left: test string ── -->
        <div class="panel flex flex-col min-h-0">
          <div class="panel-toolbar">
            <span class="text-sm font-semibold" style="color:var(--text-secondary)">Test String</span>
            <div class="flex items-center gap-2">
              @if (matchCount() > 0) {
                <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                      style="background:rgba(167,139,250,0.15);color:#a78bfa">
                  {{ matchCount() }} match{{ matchCount() === 1 ? '' : 'es' }}
                </span>
              }
              <button (click)="testStr.set('')" class="btn-icon" title="Clear" style="color:rgba(239,68,68,0.6)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
          <textarea [ngModel]="testStr()" (ngModelChange)="testStr.set($event)"
                    class="panel-body flex-1 min-h-0"
                    spellcheck="false"
                    placeholder="Enter test string here…"></textarea>
        </div>

        <!-- ── Right: results ── -->
        <div class="panel flex flex-col min-h-0 overflow-hidden">
          <div class="panel-toolbar">
            <span class="text-sm font-semibold" style="color:var(--text-secondary)">
              {{ activeTab() === 'replace' ? 'Result' : 'Matches' }}
            </span>
            @if (activeTab() === 'replace' && replaceResult()) {
              <button (click)="copyReplace()" class="btn-icon" title="Copy">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            }
          </div>

          <div class="flex-1 min-h-0 overflow-auto">
            @if (activeTab() === 'replace') {
              <!-- Replace result: full text with substitutions applied -->
              @if (replaceResult() !== null) {
                <pre class="panel-body" style="white-space:pre-wrap;color:var(--output-brand)">{{ replaceResult() }}</pre>
              } @else {
                <div class="flex items-center justify-center h-full">
                  <p class="text-sm" style="color:var(--text-muted)">Enter a pattern and replacement string.</p>
                </div>
              }
            } @else {
              <!-- Test mode: highlight view + match table -->
              @if (!testStr()) {
                <div class="flex items-center justify-center h-full">
                  <p class="text-sm" style="color:var(--text-muted)">Enter test text on the left.</p>
                </div>
              } @else if (!pattern()) {
                <!-- Show raw text without any highlights -->
                <pre class="panel-body" style="white-space:pre-wrap">{{ testStr() }}</pre>
              } @else {
                <!-- Highlighted text view -->
                <pre class="panel-body" style="white-space:pre-wrap"
                     [innerHTML]="highlightHtml()"></pre>

                <!-- Match details -->
                @if (result()?.ok && matchCount() > 0) {
                  <div class="border-t px-5 py-3" style="border-color:var(--border-subtle)">
                    <p class="text-[11px] uppercase tracking-wider mb-3 font-semibold" style="color:var(--text-muted)">
                      Match details
                    </p>
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                      @for (m of getMatches(); track $index) {
                        <div class="rounded-lg px-3 py-2 text-xs font-mono"
                             style="background:var(--bg-card);border:1px solid var(--border-subtle)">
                          <div class="flex items-center gap-3 mb-1 flex-wrap">
                            <span class="font-bold" style="color:#fbbf24">Match {{ $index + 1 }}</span>
                            <span style="color:var(--text-muted)">index {{ m.index }}</span>
                            <span style="color:var(--text-muted)">length {{ m.value.length }}</span>
                          </div>
                          <span class="break-all" style="color:var(--output-brand)">"{{ m.value }}"</span>
                          @if (m.groups.length > 0) {
                            <div class="mt-1 flex flex-wrap gap-2">
                              @for (g of m.groups; track $index; let gi = $index) {
                                <span style="color:var(--text-secondary)">group {{ gi + 1 }}: "{{ g }}"</span>
                              }
                            </div>
                          }
                          @if (m.namedGroups && objectKeys(m.namedGroups).length > 0) {
                            <div class="mt-1 flex flex-wrap gap-2">
                              @for (k of objectKeys(m.namedGroups); track k) {
                                <span style="color:#34d399">{{ k }}: "{{ m.namedGroups[k] }}"</span>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              }
            }
          </div>
        </div>
      </div>
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
export class RegexTesterComponent {
  pattern     = signal('');
  testStr     = signal('');
  replacement = signal('');
  activeTab   = signal<Tab>('test');

  flags = signal<Record<string, boolean>>({ g: true, i: false, m: false, s: false, u: false });

  readonly flagDefs = FLAG_DEFS;

  toggleFlag(key: string) {
    this.flags.update((f) => ({ ...f, [key]: !f[key] }));
  }

  flagStr = computed(() =>
    Object.entries(this.flags())
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(''),
  );

  result = computed((): RegexResult | RegexError | null => {
    const p = this.pattern();
    if (!p) return null;
    return runRegex(p, this.flagStr(), this.testStr());
  });

  matchCount = computed(() => {
    const r = this.result();
    return r?.ok ? r.matches.length : 0;
  });

  highlightHtml = computed(() => {
    const r = this.result();
    if (!r?.ok) return esc(this.testStr());
    return buildHighlight(this.testStr(), r.matches);
  });

  replaceResult = computed((): string | null => {
    const p = this.pattern();
    if (!p || !this.testStr()) return null;
    try {
      const re = new RegExp(p, this.flagStr());
      return this.testStr().replace(re, this.replacement());
    } catch {
      return null;
    }
  });

  getMatches(): RegexMatch[] {
    const r = this.result();
    return r?.ok ? r.matches : [];
  }

  getError(): string {
    const r = this.result();
    return r && !r.ok ? r.error : '';
  }

  objectKeys(obj: Record<string, string>): string[] {
    return Object.keys(obj);
  }

  copyReplace() {
    const r = this.replaceResult();
    if (r !== null) navigator.clipboard.writeText(r);
  }
}
