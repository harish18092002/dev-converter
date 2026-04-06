import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'json',
    redirectTo: 'json/xml',
    pathMatch: 'full',
  },
  {
    path: 'json/:type',
    loadComponent: () =>
      import('./features/json-tools/json-converter/json-converter.component').then(
        (m) => m.JsonConverterComponent,
      ),
  },
  {
    path: 'base64',
    loadComponent: () =>
      import('./features/encoders/base64-converter/base64-converter.component').then(
        (m) => m.Base64ConverterComponent,
      ),
  },
  {
    path: 'db',
    loadComponent: () =>
      import('./features/db-tools/sqlite-viewer/sqlite-viewer.component').then(
        (m) => m.SqliteViewerComponent,
      ),
  },
  {
    path: 'date',
    loadComponent: () =>
      import('./features/date-tools/date-converter/date-converter.component').then(
        (m) => m.DateConverterComponent,
      ),
  },
  {
    path: 'curl',
    loadComponent: () =>
      import('./features/curl-tools/curl-converter/curl-converter.component').then(
        (m) => m.CurlConverterComponent,
      ),
  },
  {
    path: 'utils',
    loadComponent: () =>
      import('./features/utility-tools/case-converter/case-converter.component').then(
        (m) => m.CaseConverterComponent,
      ),
  },
  // ── New tools ──────────────────────────────────────────────────────────────
  {
    path: 'jwt',
    loadComponent: () =>
      import('./features/security/jwt-decoder/jwt-decoder.component').then(
        (m) => m.JwtDecoderComponent,
      ),
  },
  {
    path: 'regex',
    loadComponent: () =>
      import('./features/text-tools/regex-tester/regex-tester.component').then(
        (m) => m.RegexTesterComponent,
      ),
  },
  {
    path: 'color',
    loadComponent: () =>
      import('./features/design-tools/color-converter/color-converter.component').then(
        (m) => m.ColorConverterComponent,
      ),
  },
  {
    path: 'generate',
    loadComponent: () =>
      import('./features/generate-tools/uuid-generator/uuid-generator.component').then(
        (m) => m.UuidGeneratorComponent,
      ),
  },
  {
    path: 'number',
    loadComponent: () =>
      import('./features/text-tools/number-base/number-base.component').then(
        (m) => m.NumberBaseComponent,
      ),
  },
  {
    path: 'url',
    loadComponent: () =>
      import('./features/network-tools/url-parser/url-parser.component').then(
        (m) => m.UrlParserComponent,
      ),
  },
  {
    path: 'password',
    loadComponent: () =>
      import('./features/security/password-generator/password-generator.component').then(
        (m) => m.PasswordGeneratorComponent,
      ),
  },
  {
    path: 'http-status',
    loadComponent: () =>
      import('./features/reference/http-status/http-status.component').then(
        (m) => m.HttpStatusComponent,
      ),
  },
  {
    path: 'css-units',
    loadComponent: () =>
      import('./features/design-tools/css-units/css-units.component').then(
        (m) => m.CssUnitsComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
