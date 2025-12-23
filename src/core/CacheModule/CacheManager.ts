/**
 * Менеджер кэширования для роутера
 */

import { getConfig } from "../config";

export interface CacheEntry {
  url: string;
  html: string;
  headers: Record<string, string>;
  timestamp: number;
  size: number; // Размер в байтах
  lastModified?: string; // Last-Modified заголовок
  etag?: string; // ETag заголовок
  hash?: string; // Хэш контента
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // В байтах
  hits: number;
  misses: number;
  hitRate: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
  };
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
    this.loadFromStorage();
  }

  /**
   * Проверить поддержку localStorage
   */
  private checkSupport(): void {
    try {
      const testKey = '__router_cache_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isSupported = true;
    } catch (error) {
      console.warn('⚠️ localStorage not supported, using memory cache only');
      this.isSupported = false;
    }
  }

  /**
   * Загрузить кэш из localStorage
   */
  private loadFromStorage(): void {
    if (!this.isSupported) return;

    try {
      const stored = localStorage.getItem('router_cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.cache || []);
        this.stats = data.stats || this.stats;
        
        // Проверяем, не устарел ли кэш
        this.cleanupExpired();
        
        if (getConfig().general.debug) {
          console.log('📦 Cache loaded from storage:', this.stats);
        }
      }
    } catch (error) {
      console.error('❌ Error loading cache from storage:', error);
      this.clear();
    }
  }

  /**
   * Сохранить кэш в localStorage
   */
  private saveToStorage(): void {
    if (!this.isSupported) return;

    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now(),
      };
      localStorage.setItem('router_cache', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Error saving cache to storage:', error);
    }
  }

  /**
   * Очистить просроченные записи
   */
  private cleanupExpired(): void {
    const config = getConfig();
    const now = Date.now();
    const ttlMs = config.cache.ttlHours * 60 * 60 * 1000;

    let removedCount = 0;
    
    for (const [url, entry] of this.cache.entries()) {
      // Пропускаем важные страницы
      if (config.cache.alwaysCache.includes(url)) {
        continue;
      }

      // Проверяем TTL
      if (now - entry.timestamp > ttlMs) {
        this.cache.delete(url);
        this.stats.totalSize -= entry.size;
        removedCount++;
      }
    }

    this.stats.totalEntries = this.cache.size;
    
    if (removedCount > 0 && getConfig().general.debug) {
      console.log(`🧹 Cleaned up ${removedCount} expired cache entries`);
    }
  }

  /**
   * Проверить, нужно ли обновить запись
   */
  private shouldUpdateEntry(url: string, lastModified?: string, etag?: string): boolean {
    const existing = this.cache.get(url);
    if (!existing) return true;

    // Проверяем last-modified
    if (lastModified && existing.lastModified !== lastModified) {
      return true;
    }

    // Проверяем etag
    if (etag && existing.etag !== etag) {
      return true;
    }

    return false;
  }

  /**
   * Рассчитать размер записи
   */
  private calculateSize(html: string, headers: Record<string, string>): number {
    let size = 0;
    
    // Размер HTML
    size += new Blob([html]).size;
    
    // Размер заголовков
    size += JSON.stringify(headers).length * 2; // UTF-16
    
    // Размер метаданных (примерно)
    size += 100; // timestamp, url и другие поля
    
    return size;
  }

  /**
   * Проверить, не превышен ли лимит кэша
   */
  private checkLimits(): void {
    const config = getConfig();
    const maxSizeBytes = config.cache.maxSizeMB * 1024 * 1024;
    const maxEntries = config.cache.maxEntries;

    // Если превышен лимит по размеру или количеству, удаляем старые записи
    while (
      (this.stats.totalSize > maxSizeBytes || this.cache.size > maxEntries) &&
      this.cache.size > 0
    ) {
      // Находим самую старую запись (кроме важных страниц)
      let oldestUrl: string | null = null;
      let oldestTimestamp = Date.now();

      for (const [url, entry] of this.cache.entries()) {
        // Пропускаем важные страницы
        if (config.cache.alwaysCache.includes(url)) {
          continue;
        }

        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestUrl = url;
        }
      }

      // Удаляем самую старую запись
      if (oldestUrl) {
        const entry = this.cache.get(oldestUrl)!;
        this.cache.delete(oldestUrl);
        this.stats.totalSize -= entry.size;
        this.stats.totalEntries--;
        
        if (getConfig().general.debug) {
          console.log(`🗑️ Removed old cache entry: ${oldestUrl}`);
        }
      } else {
        // Если все записи важные, выходим
        break;
      }
    }
  }

  /**
   * Добавить запись в кэш
   */
  set(
    url: string, 
    html: string, 
    headers: Record<string, string> = {}
  ): boolean {
    if (!getConfig().cache.enabled) return false;

    const config = getConfig();
    const lastModified = headers['last-modified'];
    const etag = headers['etag'];

    // Проверяем, нужно ли обновлять
    if (!this.shouldUpdateEntry(url, lastModified, etag)) {
      if (config.general.debug) {
        console.log(`♻️ Cache entry not changed: ${url}`);
      }
      return false;
    }

    // Удаляем старую запись если есть
    const oldEntry = this.cache.get(url);
    if (oldEntry) {
      this.stats.totalSize -= oldEntry.size;
    }

    // Создаем новую запись
    const size = this.calculateSize(html, headers);
    const entry: CacheEntry = {
      url,
      html,
      headers,
      timestamp: Date.now(),
      size,
      lastModified,
      etag,
    };

    // Добавляем в кэш
    this.cache.set(url, entry);
    this.stats.totalSize += size;
    this.stats.totalEntries = this.cache.size;

    // Проверяем лимиты
    this.checkLimits();

    // Сохраняем в хранилище
    this.saveToStorage();

    if (config.general.debug) {
      console.log(`💾 Cache set: ${url} (${Math.round(size / 1024)}KB)`);
    }

    return true;
  }

  /**
   * Получить запись из кэша
   */
  get(url: string): CacheEntry | null {
    if (!getConfig().cache.enabled) return null;

    const entry = this.cache.get(url);
    
    if (entry) {
      this.stats.hits++;
      this.updateHitRate();
      
      if (getConfig().general.debug) {
        console.log(`🎯 Cache hit: ${url}`);
      }
      
      return entry;
    } else {
      this.stats.misses++;
      this.updateHitRate();
      
      if (getConfig().general.debug) {
        console.log(`❌ Cache miss: ${url}`);
      }
      
      return null;
    }
  }

  /**
   * Проверить наличие записи в кэше
   */
  has(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Удалить запись из кэша
   */
  delete(url: string): boolean {
    const entry = this.cache.get(url);
    if (!entry) return false;

    this.cache.delete(url);
    this.stats.totalSize -= entry.size;
    this.stats.totalEntries--;

    this.saveToStorage();

    if (getConfig().general.debug) {
      console.log(`🗑️ Cache deleted: ${url}`);
    }

    return true;
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    const oldSize = this.cache.size;
    
    this.cache.clear();
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
    };

    if (this.isSupported) {
      localStorage.removeItem('router_cache');
    }

    if (getConfig().general.debug) {
      console.log(`🧹 Cache cleared (${oldSize} entries removed)`);
    }
  }

  /**
   * Обновить статистику попаданий
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Получить статистику кэша
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Получить все URL в кэше
   */
  getUrls(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Получить размер кэша в МБ
   */
  getSizeMB(): number {
    return Math.round(this.stats.totalSize / (1024 * 1024) * 100) / 100;
  }

  /**
   * Проверить поддержку кэширования
   */
  isCacheSupported(): boolean {
    return this.isSupported;
  }
}