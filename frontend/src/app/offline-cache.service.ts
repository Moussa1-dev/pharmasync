import { Injectable } from '@angular/core';

const CACHE_PREFIX = 'pharma-offline:';

@Injectable({ providedIn: 'root' })
export class OfflineCacheService {
  private onlineSubject = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.onlineSubject = navigator.onLine;
      window.addEventListener('online', () => { this.onlineSubject = true; });
      window.addEventListener('offline', () => { this.onlineSubject = false; });
    }
  }

  get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : this.onlineSubject;
  }

  save(key: string, data: unknown): void {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
        savedAt: new Date().toISOString(),
        data
      }));
    } catch {
      // quota ignore
    }
  }

  load<T>(key: string): { savedAt: string; data: T } | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
