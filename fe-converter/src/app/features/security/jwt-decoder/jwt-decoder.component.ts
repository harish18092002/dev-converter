import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ─── JWT utilities ────────────────────────────────────────────────────────────

/** Decode a base64url-encoded segment to a UTF-8 string */
function b64urlDecode(seg: string): string {
  // Convert base64url → base64
  const b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
  // Pad to a multiple of 4
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  // Decode safely via TextDecoder (handles Unicode)
  const raw = atob(padded);
  const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

interface JwtParts {
  header:    Record<string, unknown>;
  payload:   Record<string, unknown>;
  signature: string;
}

interface ParseResult {
  ok:    true;
  parts: JwtParts;
  raw:   [string, string, string];
}

interface ParseError {
  ok:    false;
  error: string;
}

function parseJwt(token: string): ParseResult | ParseError {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { ok: false, error: `Expected 3 dot-separated parts, got ${parts.length}` };
  }
  try {
    const header  = JSON.parse(b64urlDecode(parts[0]));
    const payload = JSON.parse(b64urlDecode(parts[1]));
    return {
      ok: true,
      parts: { header, payload, signature: parts[2] },
      raw: [parts[0], parts[1], parts[2]],
    };
  } catch (e: any) {
    return { ok: false, error: `Malformed token: ${e.message}` };
  }
}

// ─── Well-known claim descriptions ───────────────────────────────────────────
const CLAIM_INFO: Record<string, { name: string; desc: string }> = {
  iss:            { name: 'Issuer',              desc: 'Identifies the principal that issued the JWT.' },
  sub:            { name: 'Subject',             desc: 'Principal that is the subject of the JWT (usually a user ID).' },
  aud:            { name: 'Audience',            desc: 'Recipients for which the JWT is intended.' },
  exp:            { name: 'Expiration Time',     desc: 'Unix timestamp after which the JWT must not be accepted.' },
  nbf:            { name: 'Not Before',          desc: 'Unix timestamp before which the JWT must not be accepted.' },
  iat:            { name: 'Issued At',           desc: 'Unix timestamp when the JWT was issued.' },
  jti:            { name: 'JWT ID',              desc: 'Unique identifier for the token. Can prevent replay attacks.' },
  azp:            { name: 'Authorized Party',    desc: 'Party to which the ID token was issued (OAuth 2.0 client ID).' },
  scope:          { name: 'Scope',               desc: 'Permissions granted by the token (space-separated strings).' },
  email:          { name: 'Email',               desc: "Subject's email address." },
  email_verified: { name: 'Email Verified',      desc: 'Whether the email has been verified by the provider.' },
  name:           { name: 'Full Name',           desc: "Subject's full display name." },
  given_name:     { name: 'Given Name',          desc: "Subject's given (first) name." },
  family_name:    { name: 'Family Name',         desc: "Subject's family (last) name." },
  picture:        { name: 'Profile Picture URL', desc: "URL of the subject's profile picture." },
  locale:         { name: 'Locale',              desc: "Subject's locale (BCP 47 language tag)." },
  nonce:          { name: 'Nonce',               desc: 'Value used to associate a client session with an ID token.' },
  at_hash:        { name: 'Access Token Hash',   desc: 'Hash of the OAuth 2.0 access token.' },
  c_hash:         { name: 'Code Hash',           desc: 'Hash of the OAuth 2.0 authorization code.' },
  auth_time:      { name: 'Auth Time',           desc: 'Time when the end-user was authenticated (Unix timestamp).' },
  sid:            { name: 'Session ID',          desc: 'Session identifier for the authentication event.' },
  roles:          { name: 'Roles',               desc: 'Application-specific roles assigned to the subject.' },
  permissions:    { name: 'Permissions',         desc: 'Fine-grained permissions granted to the subject.' },
};

// ─── Time helpers ─────────────────────────────────────────────────────────────
function formatTs(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZoneName: 'short',
  });
}

function relTime(sec: number): string {
  const abs  = Math.abs(sec);
  const sign = sec < 0 ? 'ago' : 'from now';
  if (abs < 60)    return `${abs}s ${sign}`;
  if (abs < 3600)  return `${Math.floor(abs / 60)}m ${sign}`;
  if (abs < 86400) return `${Math.floor(abs / 3600)}h ${sign}`;
  return `${Math.floor(abs / 86400)}d ${sign}`;
}

type Tab = 'payload' | 'header' | 'signature';

@Component({
  selector: 'app-jwt-decoder',
  imports: [FormsModule],
  template: `
    <div class="tool-page-content">
      <div class="tool-page-header">
        <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
           style="color:var(--gradient-from)">Security</p>
        <h1 class="text-3xl font-bold tracking-tight" style="color:var(--text-primary)">JWT Decoder</h1>
      </div>

      <div class="tool-page-split">
        <!-- ── Left: token input ── -->
        <div class="panel flex flex-col min-h-0">
          <div class="panel-toolbar">
            <span class="text-sm font-semibold" style="color:var(--text-secondary)">JWT Token</span>
            <div class="flex gap-1">
              <button (click)="paste()" class="btn-icon" title="Paste">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </button>
              <button (click)="token.set('')" class="btn-icon" title="Clear" style="color:rgba(239,68,68,0.6)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Colour-coded token segments -->
          @if (token().trim() && parsed()?.ok) {
            <div class="px-5 py-3 text-xs font-mono break-all leading-relaxed flex-shrink-0"
                 style="border-bottom:1px solid var(--border-subtle);background:var(--bg-toolbar)">
              <span style="color:#60a5fa">{{ rawParts()[0] }}</span><span style="color:var(--text-dim)">.</span><!--
              --><span style="color:#a78bfa">{{ rawParts()[1] }}</span><span style="color:var(--text-dim)">.</span><!--
              --><span style="color:#34d399">{{ rawParts()[2] }}</span>
            </div>
          }

          <textarea [ngModel]="token()" (ngModelChange)="token.set($event)"
                    class="panel-body flex-1 min-h-0"
                    spellcheck="false"
                    placeholder="Paste your JWT here…&#10;&#10;eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyJ9.sig"></textarea>

          <!-- Expiry status -->
          @if (expiry()) {
            <div class="flex-shrink-0 px-5 py-3 flex items-center gap-2 text-xs font-medium"
                 [style.border-top]="'1px solid var(--border-subtle)'"
                 [style.background]="expiry()!.bg">
              <span class="w-2 h-2 rounded-full flex-shrink-0" [style.background]="expiry()!.dot"></span>
              <span [style.color]="expiry()!.color">{{ expiry()!.label }}</span>
            </div>
          }
        </div>

        <!-- ── Right: decoded view ── -->
        <div class="panel flex flex-col min-h-0">
          <div class="panel-toolbar">
            <div class="tab-bar">
              @for (t of tabs; track t.key) {
                <button class="tab-btn" [class.active]="activeTab() === t.key"
                        (click)="activeTab.set(t.key)">{{ t.label }}</button>
              }
            </div>
            @if (activeTabContent()) {
              <button (click)="copyTab()" class="btn-icon" title="Copy">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            }
          </div>

          <div class="flex-1 min-h-0 overflow-auto">
            @if (!token().trim()) {
              <div class="flex flex-col items-center justify-center h-full text-center p-8">
                <div class="text-4xl mb-3 opacity-30">🔒</div>
                <p class="text-sm" style="color:var(--text-muted)">Paste a JWT token on the left to decode it.</p>
              </div>
            } @else if (parsed() && !parsed()!.ok) {
              <div class="p-5">
                <div class="px-5 py-4 rounded-xl text-sm font-mono"
                     style="color:#ef4444;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12)">
                  {{ getError() }}
                </div>
              </div>
            } @else if (parsed()?.ok) {
              <!-- Header tab -->
              @if (activeTab() === 'header') {
                <pre class="panel-body" style="color:var(--output-brand)">{{ headerJson() }}</pre>
              }

              <!-- Payload tab -->
              @if (activeTab() === 'payload') {
                <div class="p-5 space-y-2">
                  @for (entry of payloadEntries(); track entry.key) {
                    <div class="rounded-xl p-3.5" style="background:var(--bg-card);border:1px solid var(--border-subtle)">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <code class="text-xs font-mono font-bold" style="color:var(--gradient-from)">{{ entry.key }}</code>
                            @if (entry.claimName) {
                              <span class="text-[10px] font-medium" style="color:var(--text-muted)">{{ entry.claimName }}</span>
                            }
                          </div>
                          @if (entry.claimDesc) {
                            <p class="text-[11px] mb-2" style="color:var(--text-dim)">{{ entry.claimDesc }}</p>
                          }
                          <code class="text-xs font-mono break-all" style="color:var(--text-primary)">{{ entry.display }}</code>
                          @if (entry.formatted) {
                            <p class="text-[11px] mt-1" style="color:var(--text-muted)">{{ entry.formatted }}</p>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Signature tab -->
              @if (activeTab() === 'signature') {
                <div class="p-5 space-y-4">
                  <div class="rounded-xl p-4" style="background:var(--bg-card);border:1px solid var(--border-subtle)">
                    <p class="text-[11px] uppercase tracking-wider mb-2 font-medium" style="color:var(--text-muted)">Algorithm</p>
                    <code class="text-sm font-mono font-bold" style="color:var(--gradient-from)">
                      {{ getHeaderField('alg') ?? 'unknown' }}
                    </code>
                  </div>
                  <div class="rounded-xl p-4" style="background:var(--bg-card);border:1px solid var(--border-subtle)">
                    <p class="text-[11px] uppercase tracking-wider mb-2 font-medium" style="color:var(--text-muted)">Signature (base64url)</p>
                    <code class="text-xs font-mono break-all" style="color:#34d399">{{ rawParts()[2] }}</code>
                  </div>
                  <div class="rounded-xl p-4"
                       style="background:rgba(251,191,36,0.04);border:1px solid rgba(251,191,36,0.15)">
                    <p class="text-xs leading-relaxed" style="color:rgba(251,191,36,0.8)">
                      ⚠️ Signature is NOT verified. To verify the signature you need the secret key or public key.
                      This tool only decodes — it does not validate cryptographic integrity.
                    </p>
                  </div>
                </div>
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
export class JwtDecoderComponent {
  token     = signal('');
  activeTab = signal<Tab>('payload');

  tabs: { key: Tab; label: string }[] = [
    { key: 'payload',   label: 'Payload'   },
    { key: 'header',    label: 'Header'    },
    { key: 'signature', label: 'Signature' },
  ];

  parsed = computed((): ParseResult | ParseError | null => {
    const t = this.token().trim();
    if (!t) return null;
    return parseJwt(t);
  });

  rawParts = computed((): [string, string, string] => {
    const r = this.parsed();
    if (r?.ok) return r.raw;
    // Even if parsing fails, show colour-split if 3 parts exist
    const p = this.token().trim().split('.');
    if (p.length === 3) return [p[0], p[1], p[2]] as [string, string, string];
    return ['', '', ''];
  });

  headerJson = computed(() => {
    const r = this.parsed();
    if (!r?.ok) return '';
    return JSON.stringify(r.parts.header, null, 2);
  });

  payloadEntries = computed(() => {
    const r = this.parsed();
    if (!r?.ok) return [];
    return Object.entries(r.parts.payload).map(([key, val]) => {
      const info   = CLAIM_INFO[key];
      const isTs   = ['exp', 'nbf', 'iat', 'auth_time'].includes(key) && typeof val === 'number';
      const display = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
      const formatted = isTs
        ? `${formatTs(val as number)}  ·  ${relTime((val as number) - Math.floor(Date.now() / 1000))}`
        : undefined;
      return {
        key,
        display,
        formatted,
        claimName: info?.name,
        claimDesc: info?.desc,
      };
    });
  });

  expiry = computed(() => {
    const r = this.parsed();
    if (!r?.ok) return null;
    const exp = r.parts.payload['exp'];
    if (typeof exp !== 'number') return null;

    const now  = Math.floor(Date.now() / 1000);
    const diff = exp - now;

    if (diff < 0) {
      return { label: `Token expired ${relTime(diff)}`, color: '#f87171', dot: '#f87171', bg: 'rgba(239,68,68,0.05)' };
    }
    if (diff < 300) {
      return { label: `Expires in ${relTime(diff)} — almost expired!`, color: '#fbbf24', dot: '#fbbf24', bg: 'rgba(251,191,36,0.05)' };
    }
    return { label: `Valid — expires in ${relTime(diff)}`, color: '#4ade80', dot: '#4ade80', bg: 'rgba(34,197,94,0.04)' };
  });

  activeTabContent = computed(() => {
    switch (this.activeTab()) {
      case 'header':    return this.headerJson();
      case 'payload':   return JSON.stringify(this.parsed()?.ok ? (this.parsed() as ParseResult).parts.payload : null, null, 2);
      case 'signature': return this.rawParts()[2];
    }
  });

  getError(): string {
    const r = this.parsed();
    return r && !r.ok ? r.error : '';
  }

  getHeaderField(key: string): unknown {
    const r = this.parsed();
    if (!r?.ok) return null;
    return r.parts.header[key];
  }

  copyTab() {
    const content = this.activeTabContent();
    if (content) navigator.clipboard.writeText(content);
  }

  async paste() {
    try {
      this.token.set(await navigator.clipboard.readText());
    } catch {}
  }
}
