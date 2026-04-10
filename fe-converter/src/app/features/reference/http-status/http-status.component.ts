import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface StatusCode {
  code: number;
  name: string;
  desc: string;
  note?: string;
}

type FilterClass = 'all' | '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

const STATUS_CODES: StatusCode[] = [
  // 1xx
  { code: 100, name: 'Continue', desc: 'The client should continue with its request; initial part has been received.' },
  { code: 101, name: 'Switching Protocols', desc: 'Server agrees to switch protocols per the Upgrade header.' },
  { code: 102, name: 'Processing', desc: 'Server received and is processing the request, no response yet.', note: 'WebDAV' },
  { code: 103, name: 'Early Hints', desc: 'Used to return headers before the final response, for preloading assets.' },
  // 2xx
  { code: 200, name: 'OK', desc: 'Request succeeded. The response body contains the requested resource.' },
  { code: 201, name: 'Created', desc: 'Request succeeded and a new resource was created. Location header points to it.' },
  { code: 202, name: 'Accepted', desc: 'Request accepted for processing but not yet completed (async operations).' },
  { code: 203, name: 'Non-Authoritative Information', desc: 'Request succeeded but response comes from a transforming proxy, not the origin.' },
  { code: 204, name: 'No Content', desc: 'Request succeeded, no body to return. Common for DELETE and PUT.' },
  { code: 205, name: 'Reset Content', desc: 'Request succeeded; client should reset the document/form that sent the request.' },
  { code: 206, name: 'Partial Content', desc: 'Partial content delivered per a Range request header. Used for resumable downloads.' },
  { code: 207, name: 'Multi-Status', desc: 'Multiple status codes for different operations in a single response body.', note: 'WebDAV' },
  { code: 208, name: 'Already Reported', desc: 'DAV binding members already enumerated in a prior part of the same multistatus.', note: 'WebDAV' },
  { code: 226, name: 'IM Used', desc: 'The server has fulfilled a GET request for a resource with instance-manipulations.' },
  // 3xx
  { code: 300, name: 'Multiple Choices', desc: 'Multiple possible responses; the user or user agent should choose one.' },
  { code: 301, name: 'Moved Permanently', desc: 'Resource permanently moved to a new URL. Browsers re-send to new URL.' },
  { code: 302, name: 'Found', desc: 'Resource temporarily moved to a different URL. Client should use original URL next time.' },
  { code: 303, name: 'See Other', desc: 'Response to POST: the resource can be found at a different URL using GET.' },
  { code: 304, name: 'Not Modified', desc: 'Cache is up to date; no need to retransmit the requested resource.' },
  { code: 307, name: 'Temporary Redirect', desc: 'Temporary redirect; method and body MUST NOT change on redirect (unlike 302).' },
  { code: 308, name: 'Permanent Redirect', desc: 'Permanent redirect; method and body MUST NOT change on redirect (unlike 301).' },
  // 4xx
  { code: 400, name: 'Bad Request', desc: 'Server cannot process the request due to malformed syntax or invalid parameters.' },
  { code: 401, name: 'Unauthorized', desc: 'Authentication is required and has failed or not been provided.' },
  { code: 402, name: 'Payment Required', desc: 'Reserved for future use; some APIs use it for rate limit or quota exceeded.' },
  { code: 403, name: 'Forbidden', desc: 'Server understood the request but refuses to authorize it — valid credentials won\'t help.' },
  { code: 404, name: 'Not Found', desc: 'Requested resource could not be found on the server.' },
  { code: 405, name: 'Method Not Allowed', desc: 'HTTP method is not supported for the requested resource.' },
  { code: 406, name: 'Not Acceptable', desc: 'No content matching the Accept headers of the request.' },
  { code: 407, name: 'Proxy Authentication Required', desc: 'Client must first authenticate with the proxy.' },
  { code: 408, name: 'Request Timeout', desc: 'Server timed out waiting for the request from the client.' },
  { code: 409, name: 'Conflict', desc: 'Request conflicts with the current state of the resource (e.g., edit conflict).' },
  { code: 410, name: 'Gone', desc: 'Resource is permanently gone; no forwarding address. Different from 404 — intentional removal.' },
  { code: 411, name: 'Length Required', desc: 'Server requires Content-Length header but it was not sent.' },
  { code: 412, name: 'Precondition Failed', desc: 'One or more conditions in the request headers evaluated to false on the server.' },
  { code: 413, name: 'Content Too Large', desc: 'Request body exceeds the limits defined by the server.' },
  { code: 414, name: 'URI Too Long', desc: 'The URI requested by the client is longer than the server is willing to process.' },
  { code: 415, name: 'Unsupported Media Type', desc: 'Media format of the request body is not supported by the server.' },
  { code: 416, name: 'Range Not Satisfiable', desc: 'Range header value cannot be fulfilled; outside the resource\'s bounds.' },
  { code: 417, name: 'Expectation Failed', desc: 'Expectation indicated by the Expect request header cannot be met by the server.' },
  { code: 418, name: "I'm a Teapot", desc: 'Server refuses to brew coffee in a teapot. An April Fools\' joke in RFC 2324.', note: 'RFC 2324' },
  { code: 421, name: 'Misdirected Request', desc: 'Request was directed to a server unable to produce a response for that combination.' },
  { code: 422, name: 'Unprocessable Content', desc: 'Request is well-formed but contains semantic errors (e.g., validation failures).' },
  { code: 423, name: 'Locked', desc: 'Resource is locked.', note: 'WebDAV' },
  { code: 424, name: 'Failed Dependency', desc: 'Request failed due to failure of a previous request.', note: 'WebDAV' },
  { code: 425, name: 'Too Early', desc: 'Server is unwilling to risk processing a request that might be replayed.' },
  { code: 426, name: 'Upgrade Required', desc: 'Client should switch to a different protocol specified in the Upgrade header.' },
  { code: 428, name: 'Precondition Required', desc: 'Origin server requires the request to be conditional to prevent lost-update problems.' },
  { code: 429, name: 'Too Many Requests', desc: 'Client has sent too many requests in a given amount of time (rate limiting).' },
  { code: 431, name: 'Request Header Fields Too Large', desc: 'Server unwilling to process the request because header fields are too large.' },
  { code: 451, name: 'Unavailable For Legal Reasons', desc: 'Resource cannot be provided due to legal demands (e.g., government censorship).' },
  // 5xx
  { code: 500, name: 'Internal Server Error', desc: 'Generic server error — an unexpected condition was encountered.' },
  { code: 501, name: 'Not Implemented', desc: 'Server does not support the functionality required to fulfill the request.' },
  { code: 502, name: 'Bad Gateway', desc: 'Server acting as a gateway got an invalid response from an upstream server.' },
  { code: 503, name: 'Service Unavailable', desc: 'Server is not ready to handle the request — overloaded or down for maintenance.' },
  { code: 504, name: 'Gateway Timeout', desc: 'Server acting as a gateway did not get a response in time from the upstream server.' },
  { code: 505, name: 'HTTP Version Not Supported', desc: 'HTTP version used in the request is not supported by the server.' },
  { code: 506, name: 'Variant Also Negotiates', desc: 'Server has an internal configuration error in content negotiation.' },
  { code: 507, name: 'Insufficient Storage', desc: 'Server cannot store the representation needed to complete the request.', note: 'WebDAV' },
  { code: 508, name: 'Loop Detected', desc: 'Server detected an infinite loop while processing the request.', note: 'WebDAV' },
  { code: 510, name: 'Not Extended', desc: 'Further extensions to the request are required for the server to fulfil it.' },
  { code: 511, name: 'Network Authentication Required', desc: 'Client must authenticate to gain network access (e.g., captive portals).' },
];

function classOf(code: number): '1xx' | '2xx' | '3xx' | '4xx' | '5xx' {
  if (code < 200) return '1xx';
  if (code < 300) return '2xx';
  if (code < 400) return '3xx';
  if (code < 500) return '4xx';
  return '5xx';
}

const CLASS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '1xx': { bg: 'rgba(6,182,212,0.08)',   text: '#22d3ee', border: 'rgba(6,182,212,0.2)' },
  '2xx': { bg: 'rgba(34,197,94,0.08)',   text: '#4ade80', border: 'rgba(34,197,94,0.2)' },
  '3xx': { bg: 'rgba(251,191,36,0.08)',  text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  '4xx': { bg: 'rgba(249,115,22,0.08)',  text: '#fb923c', border: 'rgba(249,115,22,0.2)' },
  '5xx': { bg: 'rgba(239,68,68,0.08)',   text: '#f87171', border: 'rgba(239,68,68,0.2)' },
};

@Component({
  selector: 'app-http-status',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen" style="padding: 80px 0 64px">
      <div class="container mx-auto px-6 lg:px-10">

        <div class="tool-page-header">
          <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-2"
             style="color:var(--gradient-from)">Reference</p>
          <h1 class="text-3xl font-bold tracking-tight mb-1" style="color:var(--text-primary)">
            HTTP Status Codes
          </h1>
          <p class="text-sm" style="color:var(--text-muted)">
            {{ allCodes.length }} codes across 5 classes — RFC 9110 &amp; extensions
          </p>
        </div>

        <!-- Search + filter bar -->
        <div class="flex flex-wrap items-center gap-3 mb-8 mt-6">
          <div class="relative flex-1 min-w-48">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                 style="color:var(--text-muted)" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input [ngModel]="query()" (ngModelChange)="query.set($event)"
                   type="text" placeholder="Search by code, name, or description…"
                   class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                   style="background:var(--bg-input);border:1px solid var(--border-subtle);color:var(--text-primary)"/>
          </div>

          <div class="tab-bar">
            @for (f of filterOptions; track f.value) {
              <button class="tab-btn" [class.active]="activeFilter() === f.value"
                      (click)="activeFilter.set(f.value)">
                {{ f.label }}
              </button>
            }
          </div>
        </div>

        <!-- Results count -->
        @if (filtered().length === 0) {
          <div class="text-center py-24" style="color:var(--text-muted)">
            No status codes match "{{ query() }}"
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            @for (s of filtered(); track s.code) {
              <div class="rounded-2xl p-5 transition-all duration-200"
                   [style.background]="classColors(s.code).bg"
                   [style.border]="'1px solid ' + classColors(s.code).border">
                <div class="flex items-start gap-4">
                  <div class="text-2xl font-black font-mono leading-none mt-0.5 tabular-nums"
                       [style.color]="classColors(s.code).text">
                    {{ s.code }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span class="font-semibold text-sm" style="color:var(--text-primary)">{{ s.name }}</span>
                      @if (s.note) {
                        <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium"
                              style="background:var(--tag-bg);color:var(--text-muted)">{{ s.note }}</span>
                      }
                    </div>
                    <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">{{ s.desc }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
          <p class="mt-6 text-xs text-center" style="color:var(--text-dim)">
            Showing {{ filtered().length }} of {{ allCodes.length }} codes
          </p>
        }
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpStatusComponent {
  readonly allCodes = STATUS_CODES;

  query = signal('');
  activeFilter = signal<FilterClass>('all');

  filterOptions: { label: string; value: FilterClass }[] = [
    { label: 'All', value: 'all' },
    { label: '1xx', value: '1xx' },
    { label: '2xx', value: '2xx' },
    { label: '3xx', value: '3xx' },
    { label: '4xx', value: '4xx' },
    { label: '5xx', value: '5xx' },
  ];

  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const cls = this.activeFilter();
    return STATUS_CODES.filter((s) => {
      const matchesClass = cls === 'all' || classOf(s.code) === cls;
      if (!matchesClass) return false;
      if (!q) return true;
      return (
        s.code.toString().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q)
      );
    });
  });

  classColors(code: number) {
    return CLASS_COLORS[classOf(code)];
  }
}
