import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private componentsLoading = signal(new Set<string>());
  isLoading = signal(true);

  startLoading(componentName: string) {
    this.componentsLoading.update(set => {
      const newSet = new Set(set);
      newSet.add(componentName);
      return newSet;
    });
    this.isLoading.set(true);
  }

  finishLoading(componentName: string) {
    this.componentsLoading.update(set => {
      const newSet = new Set(set);
      newSet.delete(componentName);
      return newSet;
    });
    
    if (this.componentsLoading().size === 0) {
      this.isLoading.set(false);
    }
  }

  isComponentLoading(componentName: string): boolean {
    return this.componentsLoading().has(componentName);
  }
}
