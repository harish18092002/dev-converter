import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConverterService } from '../../../core/services/converter.service';

@Component({
  selector: 'app-base64-converter',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen pt-20 pb-16">
      <div class="container mx-auto px-6 lg:px-10">
        <div class="mb-8">
          <p
            class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
            style="color:var(--gradient-from)"
          >
            Encoding
          </p>
          <h1 class="text-3xl font-bold tracking-tight" style="color:var(--text-primary)">
            Base64 Tools
          </h1>
        </div>

        <div class="tab-bar mb-6 w-fit">
          <button (click)="mode.set('string')" class="tab-btn" [class.active]="mode() === 'string'">
            String
          </button>
          <button (click)="mode.set('file')" class="tab-btn" [class.active]="mode() === 'file'">
            File / Image
          </button>
        </div>

        @if (mode() === 'string') {
          <div class="flex items-center gap-3 mb-6">
            <button (click)="isEncode.set(true)" class="tab-btn" [class.active]="isEncode()">
              Encode
            </button>
            <button (click)="toggleDir()" class="btn-icon">
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
            <button (click)="isEncode.set(false)" class="tab-btn" [class.active]="!isEncode()">
              Decode
            </button>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" style="height:420px">
            <div class="panel flex flex-col">
              <div class="panel-toolbar">
                <span class="text-sm font-semibold" style="color:var(--text-secondary)">{{
                  isEncode() ? 'Plain Text' : 'Base64'
                }}</span>
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
                  <button
                    (click)="input.set(''); output.set(''); previewUrl.set(null)"
                    class="btn-icon"
                    style="color:rgba(239,68,68,0.6)"
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
                [ngModel]="input()"
                (ngModelChange)="onInput($event)"
                class="panel-body flex-1"
                spellcheck="false"
                placeholder="Type or paste text..."
              ></textarea>
            </div>
            <div class="panel flex flex-col relative group">
              <div class="panel-toolbar">
                <span class="text-sm font-semibold" style="color:var(--text-secondary)">{{
                  previewUrl() ? 'Image Preview' : isEncode() ? 'Base64' : 'Decoded'
                }}</span>
                <div class="flex gap-1" *ngIf="!previewUrl()">
                  <button (click)="copyOut()" class="btn-icon" title="Copy">
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
                <div class="flex gap-1" *ngIf="previewUrl()">
                  <button
                    (click)="isExpanded.set(true)"
                    class="text-xs font-semibold px-2 py-1 rounded"
                    style="color:var(--text-primary); background:var(--bg-card-hover)"
                  >
                    Expand
                  </button>
                  <button
                    (click)="previewUrl.set(null)"
                    class="text-xs font-semibold px-2 py-1 rounded"
                    style="background:var(--bg-card-hover);color:var(--text-muted)"
                  >
                    Close
                  </button>
                  <a
                    [href]="previewUrl()"
                    download="image.png"
                    class="text-xs font-semibold px-2 py-1 rounded ml-1"
                    style="background:var(--accent-gradient);color:white"
                  >
                    Download
                  </a>
                </div>
              </div>

              @if (previewUrl()) {
                <div
                  class="absolute inset-0 z-10 flex flex-col items-center justify-center p-2 backdrop-blur-xl bg-black/60 rounded-b-2xl cursor-zoom-in"
                  (click)="isExpanded.set(true)"
                >
                  <img
                    [src]="previewUrl()"
                    class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    style="border:1px solid var(--border-subtle)"
                    alt="Base64 Preview"
                  />
                </div>
              }

              @if (isExpanded() && previewUrl()) {
                <div
                  class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-8"
                  (click)="isExpanded.set(false)"
                >
                  <div class="relative max-w-full max-h-full" (click)="$event.stopPropagation()">
                    <button
                      (click)="isExpanded.set(false)"
                      class="absolute -top-12 right-0 text-white/70 hover:text-white pb-2 flex items-center gap-1 font-semibold"
                    >
                      <span class="text-sm">Close</span>
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <img
                      [src]="previewUrl()"
                      class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
                    />
                  </div>
                </div>
              }

              <textarea
                readonly
                [value]="output()"
                class="panel-body flex-1"
                style="color:var(--output-gold)"
                spellcheck="false"
              ></textarea>
            </div>
          </div>
        } @else {
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
              <input #fi type="file" class="hidden" (change)="onFile($event)" />
              <div class="text-5xl mb-3 opacity-60">📎</div>
              <h3 class="text-lg font-semibold mb-1" style="color:var(--text-primary)">
                Drop any file here
              </h3>
              <p class="text-sm" style="color:var(--text-muted)">PNG, JPG, PDF, or any binary</p>
            </div>
            @if (fileResult()) {
              <div class="mt-8 text-left glass rounded-xl p-6">
                <div class="flex justify-between items-center mb-3">
                  <span class="font-semibold text-sm" style="color:var(--text-primary)"
                    >Base64 Output</span
                  >
                  <button
                    (click)="copyFile()"
                    class="btn-icon text-xs font-medium"
                    style="color:var(--gradient-from)"
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  readonly
                  class="w-full h-28 rounded-xl p-4 font-mono text-xs resize-none focus:outline-none"
                  style="background:var(--bg-input);color:var(--text-secondary);border:1px solid var(--border-subtle)"
                  [value]="fileResult()"
                ></textarea>
                @if (isImg()) {
                  <div class="mt-4">
                    <p
                      class="text-[11px] uppercase tracking-wider mb-2"
                      style="color:var(--text-dim)"
                    >
                      Preview
                    </p>
                    <img
                      [src]="fileResult()"
                      class="max-h-56 rounded-xl"
                      style="border:1px solid var(--border-subtle)"
                      alt="Preview"
                    />
                  </div>
                }
              </div>
            }
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
export class Base64ConverterComponent {
  private svc = inject(ConverterService);
  mode = signal<'string' | 'file'>('string');
  isEncode = signal(true);
  isExpanded = signal(false);
  input = signal('');
  output = signal('');
  fileResult = signal<string | null>(null);
  previewUrl = signal<string | null>(null);

  toggleDir() {
    this.isEncode.update((v) => !v);
    this.doConvert();
  }
  onInput(v: string) {
    this.input.set(v);
    this.doConvert();
  }
  doConvert() {
    const v = this.input().trim();
    this.previewUrl.set(null);

    if (!v) {
      this.output.set('');
      return;
    }
    try {
      if (this.isEncode()) {
        this.output.set(this.svc.toBase64(v));
      } else {
        // Decode logic
        // Check for image data URI first
        if (v.startsWith('data:image')) {
          this.previewUrl.set(v);
          // Strip prefix for text output if desired, or keep it. user usually wants to see the raw text or the decoded bits?
          // If it's an image, decoding to text will just be garbage.
          this.output.set('(Binary Image Data)');
        } else {
          // Try to detect if it's a raw base64 encoded image
          // Common headers: /9j/ (JPG), iVBORw0KGgo (PNG), R0lGOD (GIF)
          if (v.startsWith('/9j/') || v.startsWith('iVBORw0KGgo') || v.startsWith('R0lGOD')) {
            let mime = 'image/png';
            if (v.startsWith('/9j/')) mime = 'image/jpeg';
            if (v.startsWith('R0lGOD')) mime = 'image/gif';
            this.previewUrl.set(`data:${mime};base64,${v}`);
          }

          try {
            this.output.set(this.svc.fromBase64(v));
          } catch {
            // If it fails to decode as text, it might just be binary.
            this.output.set('Binary data (could not decode to UTF-8 text)');
          }
        }
      }
    } catch {
      this.output.set('Error: Invalid input');
    }
  }
  onFile(e: any) {
    const f = e.target.files[0];
    if (f) this.readFile(f);
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer?.files[0];
    if (f) this.readFile(f);
  }
  readFile(f: File) {
    const r = new FileReader();
    r.onload = (e) => this.fileResult.set(e.target?.result as string);
    r.readAsDataURL(f);
  }
  isImg() {
    return this.fileResult()?.startsWith('data:image');
  }
  async pasteClip() {
    try {
      this.input.set(await navigator.clipboard.readText());
      this.doConvert();
    } catch {}
  }
  copyOut() {
    navigator.clipboard.writeText(this.output());
  }
  copyFile() {
    navigator.clipboard.writeText(this.fileResult() || '');
  }
}
