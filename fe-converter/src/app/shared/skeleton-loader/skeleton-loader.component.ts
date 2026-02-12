import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  template: `
    <div class="min-h-screen pt-20 pb-16">
      <div class="container mx-auto px-6 lg:px-10">
        <!-- Title skeleton -->
        <div class="mb-8">
          <div class="skel h-3 w-28 mb-3 rounded-md"></div>
          <div class="skel h-9 w-64 rounded-lg"></div>
        </div>

        <!-- Tab bar skeleton -->
        <div class="skel h-12 w-80 rounded-xl mb-6"></div>

        <!-- Panels skeleton -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" style="height: 520px">
          <div class="skel-panel rounded-2xl flex flex-col">
            <div class="skel-toolbar flex items-center justify-between px-5 py-4">
              <div class="skel h-4 w-24 rounded-md"></div>
              <div class="flex gap-2">
                <div class="skel h-7 w-7 rounded-lg"></div>
                <div class="skel h-7 w-7 rounded-lg"></div>
                <div class="skel h-7 w-7 rounded-lg"></div>
              </div>
            </div>
            <div class="flex-1 p-5 space-y-3">
              <div class="skel h-3.5 w-full rounded-md"></div>
              <div class="skel h-3.5 w-4/5 rounded-md"></div>
              <div class="skel h-3.5 w-3/5 rounded-md"></div>
              <div class="skel h-3.5 w-5/6 rounded-md"></div>
              <div class="skel h-3.5 w-2/3 rounded-md"></div>
              <div class="skel h-3.5 w-4/5 rounded-md"></div>
              <div class="skel h-3.5 w-1/2 rounded-md"></div>
            </div>
          </div>

          <div class="skel-panel rounded-2xl flex flex-col">
            <div class="skel-toolbar flex items-center justify-between px-5 py-4">
              <div class="skel h-4 w-28 rounded-md"></div>
              <div class="flex gap-2">
                <div class="skel h-7 w-7 rounded-lg"></div>
                <div class="skel h-7 w-7 rounded-lg"></div>
              </div>
            </div>
            <div class="flex-1 p-5 space-y-3">
              <div class="skel h-3.5 w-5/6 rounded-md"></div>
              <div class="skel h-3.5 w-full rounded-md"></div>
              <div class="skel h-3.5 w-3/4 rounded-md"></div>
              <div class="skel h-3.5 w-4/5 rounded-md"></div>
              <div class="skel h-3.5 w-2/5 rounded-md"></div>
              <div class="skel h-3.5 w-3/5 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .skel {
        background: linear-gradient(
          90deg,
          var(--bg-card) 0%,
          var(--bg-card-hover) 20%,
          rgba(139, 92, 246, 0.06) 40%,
          var(--bg-card-hover) 60%,
          var(--bg-card) 100%
        );
        background-size: 300% 100%;
        animation: skel-shimmer 2s ease-in-out infinite;
      }
      .skel-panel {
        background: var(--bg-panel);
        border: 1px solid var(--border-subtle);
      }
      .skel-toolbar {
        border-bottom: 1px solid var(--border-subtle);
        background: var(--bg-toolbar);
      }
      @keyframes skel-shimmer {
        0% {
          background-position: 300% 0;
        }
        100% {
          background-position: -300% 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonLoaderComponent {}
