import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="relative py-16" style="border-top: 1px solid var(--footer-border)">
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
        style="background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),rgba(251,191,36,0.15),transparent)"
      ></div>
      <div class="container mx-auto px-6 lg:px-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div class="md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[10px]"
                style="background:linear-gradient(135deg,#7c3aed,#f59e0b)"
              >
                DC
              </div>
              <span class="font-bold tracking-tight" style="color:var(--text-primary)"
                >DevConverter</span
              >
            </div>
            <p class="text-sm leading-relaxed max-w-sm" style="color:var(--text-muted)">
              Free, privacy-first developer utilities. Every conversion runs entirely in your
              browser.
            </p>
          </div>
          <div>
            <h4
              class="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4"
              style="color:var(--text-muted)"
            >
              Tools
            </h4>
            <ul class="space-y-2.5 text-sm">
              <li><a routerLink="/json" class="footer-link">JSON Tools</a></li>
              <li><a routerLink="/base64" class="footer-link">Base64</a></li>
              <li><a routerLink="/db" class="footer-link">Database</a></li>
              <li><a routerLink="/date" class="footer-link">DateTime</a></li>
            </ul>
          </div>
          <div>
            <h4
              class="text-[11px] font-semibold uppercase tracking-[0.15em] mb-4"
              style="color:var(--text-muted)"
            >
              More
            </h4>
            <ul class="space-y-2.5 text-sm">
              <li><a routerLink="/curl" class="footer-link">cURL</a></li>
              <li><a routerLink="/utils" class="footer-link">Case Utils</a></li>
              <li><span style="color:var(--text-dim)">100% Client-Side</span></li>
              <li><span style="color:var(--text-dim)">Open Source</span></li>
            </ul>
          </div>
        </div>
        <div
          class="pt-6 flex items-center justify-between"
          style="border-top:1px solid var(--footer-border)"
        >
          <p class="text-[11px]" style="color:var(--footer-sub-text)">
            &copy; {{ year }} DevConverter
          </p>
          <p class="text-[11px]" style="color:var(--footer-sub-text)">
            Built with Angular &amp; Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .footer-link {
        color: var(--text-secondary);
        transition: color 0.3s;
      }
      .footer-link:hover {
        color: var(--gradient-from);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
