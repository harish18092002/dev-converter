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
  { path: '**', redirectTo: '' },
];
