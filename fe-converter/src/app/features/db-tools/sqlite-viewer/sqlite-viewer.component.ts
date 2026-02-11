import { Component, signal, ChangeDetectionStrategy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sqlite-viewer',
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
            Database
          </p>
          <h1 class="text-3xl font-bold tracking-tight" style="color:var(--text-primary)">
            SQLite Viewer
          </h1>
        </div>

        @if (!db()) {
          <div
            class="glass rounded-2xl p-10 text-center"
            (dragover)="$event.preventDefault()"
            (drop)="onDrop($event)"
          >
            <div
              class="border-2 border-dashed rounded-2xl p-16 transition-colors cursor-pointer"
              style="border-color:var(--border-subtle)"
              (click)="fi.click()"
            >
              <input
                #fi
                type="file"
                accept=".db,.sqlite,.sqlite3"
                class="hidden"
                (change)="onFile($event)"
              />
              <div class="text-5xl mb-3 opacity-60">🗄️</div>
              <h3 class="text-lg font-semibold mb-1" style="color:var(--text-primary)">
                Drop your SQLite database
              </h3>
              <p class="text-sm" style="color:var(--text-muted)">.db, .sqlite, .sqlite3</p>
            </div>
          </div>
        } @else {
          <div class="flex flex-col lg:flex-row gap-6">
            <div class="lg:w-60 flex-shrink-0 glass rounded-2xl p-4">
              <div class="flex items-center justify-between mb-4">
                <span
                  class="text-[11px] uppercase tracking-[0.15em] font-semibold"
                  style="color:var(--text-muted)"
                  >Tables</span
                >
                <button
                  (click)="closeDb()"
                  class="btn-icon text-[10px]"
                  style="color:rgba(239,68,68,0.6)"
                >
                  Close
                </button>
              </div>
              @for (t of tables(); track t) {
                <button
                  (click)="selectTable(t)"
                  class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all mb-0.5"
                  [style.background]="
                    selectedTable() === t ? 'rgba(124,58,237,0.15)' : 'transparent'
                  "
                  [style.color]="
                    selectedTable() === t ? 'var(--text-primary)' : 'var(--text-secondary)'
                  "
                  [style.font-weight]="selectedTable() === t ? '500' : '400'"
                >
                  {{ t }}
                </button>
              }
            </div>
            <div class="flex-1 min-w-0">
              @if (selectedTable()) {
                <div class="flex items-center gap-3 mb-4">
                  <span class="text-sm font-medium mr-auto" style="color:var(--text-secondary)"
                    >{{ selectedTable() }} &middot; {{ rows().length }} rows</span
                  >
                  <button
                    (click)="exportJson()"
                    class="btn-icon text-xs font-medium"
                    style="color:var(--gradient-from)"
                  >
                    JSON
                  </button>
                  <button
                    (click)="exportCsv()"
                    class="btn-icon text-xs font-medium"
                    style="color:#22c55e"
                  >
                    CSV
                  </button>
                </div>
                <div class="panel overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr style="border-bottom:1px solid var(--border-subtle)">
                        @for (c of columns(); track c) {
                          <th
                            class="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                            style="color:var(--text-muted)"
                          >
                            {{ c }}
                          </th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of rows(); track $index) {
                        <tr
                          class="transition-colors"
                          style="border-bottom:1px solid var(--border-subtle)"
                          onmouseenter="this.style.background='var(--bg-card-hover)'"
                          onmouseleave="this.style.background='transparent'"
                        >
                          @for (c of columns(); track c) {
                            <td
                              class="px-4 py-2.5 font-mono text-xs whitespace-nowrap max-w-[180px] truncate"
                              style="color:var(--text-primary)"
                            >
                              {{ row[c] }}
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div class="panel p-16 text-center" style="color:var(--text-dim)">
                  <p>Select a table to view data</p>
                </div>
              }
            </div>
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
export class SqliteViewerComponent {
  private pid = inject(PLATFORM_ID);
  private SQL: any;
  db = signal<any>(null);
  tables = signal<string[]>([]);
  selectedTable = signal('');
  columns = signal<string[]>([]);
  rows = signal<any[]>([]);

  onFile(e: any) {
    const f = e.target.files[0];
    if (f) this.load(f);
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer?.files[0];
    if (f) this.load(f);
  }

  async load(file: File) {
    if (!isPlatformBrowser(this.pid)) return;
    const init = (await import('sql.js')).default;
    this.SQL = await init({ locateFile: () => '/sql-wasm.wasm' });
    const buf = await file.arrayBuffer();
    const database = new this.SQL.Database(new Uint8Array(buf));
    this.db.set(database);
    const res = database.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    if (res.length > 0) {
      const names = res[0].values.map((r: any[]) => r[0] as string);
      this.tables.set(names);
      if (names.length) this.selectTable(names[0]);
    }
  }

  selectTable(name: string) {
    this.selectedTable.set(name);
    const d = this.db();
    if (!d) return;
    const res = d.exec('SELECT * FROM "' + name + '" LIMIT 100');
    if (res.length > 0) {
      this.columns.set(res[0].columns);
      this.rows.set(
        res[0].values.map((v: any[]) => {
          const o: any = {};
          res[0].columns.forEach((c: string, i: number) => {
            o[c] = v[i];
          });
          return o;
        }),
      );
    } else {
      this.columns.set([]);
      this.rows.set([]);
    }
  }

  closeDb() {
    this.db()?.close();
    this.db.set(null);
    this.tables.set([]);
    this.selectedTable.set('');
    this.columns.set([]);
    this.rows.set([]);
  }

  exportJson() {
    this.dl(
      JSON.stringify(this.rows(), null, 2),
      this.selectedTable() + '.json',
      'application/json',
    );
  }
  exportCsv() {
    const cols = this.columns();
    const lines = [
      cols.join(','),
      ...this.rows().map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(',')),
    ];
    this.dl(lines.join('\n'), this.selectedTable() + '.csv', 'text/csv');
  }
  private dl(content: string, name: string, type: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
  }
}
