import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoMeta {
  title: string;       // page-specific part — " | DevConverter" is appended automatically
  description: string;
  keywords: string;
  path: string;        // canonical path e.g. "/json"
  schema?: Record<string, unknown>;
}

// ── Update this to your real Firebase / custom domain ──────────────────────
export const SITE_URL = 'https://devconverter-87f4f.web.app';
// ──────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private doc = inject(DOCUMENT);

  apply(config: SeoMeta): void {
    const fullTitle = `${config.title} | DevConverter`;
    const canonical = `${SITE_URL}${config.path}`;
    const ogImage = `${SITE_URL}/og-image.png`;

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'keywords',    content: config.keywords });
    this.meta.updateTag({ name: 'robots',      content: 'index, follow' });

    this.meta.updateTag({ property: 'og:title',       content: fullTitle });
    this.meta.updateTag({ property: 'og:description',  content: config.description });
    this.meta.updateTag({ property: 'og:url',          content: canonical });
    this.meta.updateTag({ property: 'og:type',         content: 'website' });
    this.meta.updateTag({ property: 'og:image',        content: ogImage });
    this.meta.updateTag({ property: 'og:site_name',    content: 'DevConverter' });

    this.meta.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',       content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image',       content: ogImage });

    this.upsertLink('canonical', canonical);

    if (config.schema) this.upsertJsonLd(config.schema);
  }

  private upsertLink(rel: string, href: string): void {
    let el = this.doc.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!el) {
      el = this.doc.createElement('link');
      el.setAttribute('rel', rel);
      this.doc.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  private upsertJsonLd(data: Record<string, unknown>): void {
    const id = 'seo-json-ld-page';
    let script = this.doc.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.doc.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.doc.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
