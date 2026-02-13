import { Component, signal, inject, afterNextRender } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  RouterOutlet,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { HeaderComponent } from './core/header/header.component';
import { FooterComponent } from './core/footer/footer.component';
import { SkeletonLoaderComponent } from './shared/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SkeletonLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private router = inject(Router);
  protected readonly title = signal('fe-converter');
  protected isNavigating = signal(false);
  private navTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      const loader = document.getElementById('app-loader');
      if (loader) {
        setTimeout(() => {
          loader.classList.add('loader-hidden');
          setTimeout(() => loader.remove(), 600);
        }, 300);
      }

      this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.navTimer = setTimeout(() => this.isNavigating.set(true), 200);
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          if (this.navTimer) clearTimeout(this.navTimer);
          this.isNavigating.set(false);
        }
      });
    });
  }
}
