import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ── Static pages — prerendered to HTML at build time ──────────────────────
  // Each gets its own index.html with correct title/meta baked in,
  // which search engines read directly without executing JavaScript.
  { path: '',            renderMode: RenderMode.Prerender },
  { path: 'base64',      renderMode: RenderMode.Prerender },
  { path: 'jwt',         renderMode: RenderMode.Prerender },
  { path: 'regex',       renderMode: RenderMode.Prerender },
  { path: 'color',       renderMode: RenderMode.Prerender },
  { path: 'url',         renderMode: RenderMode.Prerender },
  { path: 'password',    renderMode: RenderMode.Prerender },
  { path: 'generate',    renderMode: RenderMode.Prerender },
  { path: 'number',      renderMode: RenderMode.Prerender },
  { path: 'css-units',   renderMode: RenderMode.Prerender },
  { path: 'http-status', renderMode: RenderMode.Prerender },
  { path: 'date',        renderMode: RenderMode.Prerender },
  { path: 'curl',        renderMode: RenderMode.Prerender },
  { path: 'utils',       renderMode: RenderMode.Prerender },
  { path: 'db',          renderMode: RenderMode.Prerender },

  // ── Parameterised JSON route — prerender the 5 most-searched sub-types ────
  {
    path: 'json/:type',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { type: 'xml'  },
      { type: 'yaml' },
      { type: 'csv'  },
      { type: 'sql'  },
      { type: 'toml' },
    ],
  },

  // ── Anything else (404 redirect, etc.) ────────────────────────────────────
  { path: '**', renderMode: RenderMode.Client },
];
