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
import { filter } from 'rxjs';
import { HeaderComponent } from './core/header/header.component';
import { FooterComponent } from './core/footer/footer.component';
import { SkeletonLoaderComponent } from './shared/skeleton-loader/skeleton-loader.component';
import { SeoService } from './core/services/seo.service';
import { getSeoForUrl } from './core/seo/seo-routes.config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SkeletonLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private router = inject(Router);
  private seo = inject(SeoService);

  protected readonly title = signal('fe-converter');
  protected isNavigating = signal(false);
  private navTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Apply SEO on initial navigation and every subsequent route change
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        this.seo.apply(getSeoForUrl(url));
      });

    afterNextRender(() => {
      const loader = document.getElementById('app-loader');
      if (loader) {
        loader.classList.add('loader-hidden');
        setTimeout(() => loader.remove(), 600);
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
