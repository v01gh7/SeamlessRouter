/**
 * Менеджер предзагрузки страниц
 */

import { getConfig, isMobileDevice, getPrefetchLimit } from "../config";
import { CacheManager } from "../CacheModule";
import { IntelligentPrefetch } from "./IntelligentPrefetch";

export interface PrefetchRequest {
  url: string;
  priority: 'low' | 'high' | 'auto';
  timestamp: number;
  controller?: AbortController;
}

export class PrefetchManager {
  private cacheManager: CacheManager;
  private intelligentPrefetch: IntelligentPrefetch;
  private queue: PrefetchRequest[] = [];
  private activeRequests: Set<string> = new Set();
  private maxConcurrent: number = 3;
  private isEnabled: boolean = true;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
    this.intelligentPrefetch = new IntelligentPrefetch(this);
    this.isEnabled = getConfig().prefetch.enabled;
    
    // Настраиваем максимальное количество параллельных запросов
    this.maxConcurrent = isMobileDevice() ? 2 : 3;
  }

  /**
   * Предзагрузить страницу
   */
  async prefetch(url: string, priority: 'low' | 'high' | 'auto' = 'low'): Promise<boolean> {
    if (!this.isEnabled) return false;

    // Проверяем, не загружается ли уже эта страница
    if (this.activeRequests.has(url)) {
      return false;
    }

    // Проверяем, есть ли уже в кэше
    if (this.cacheManager.has(url)) {
      return false;
    }

    // Создаем запрос
    const request: PrefetchRequest = {
      url,
      priority,
      timestamp: Date.now(),
      controller: new AbortController(),
    };

    // Добавляем в очередь согласно приоритету
    this.addToQueue(request);
    
    // Запускаем обработку очереди
    this.processQueue();

    return true;
  }

  /**
   * Добавить запрос в очередь с учетом приоритета
   */
  private addToQueue(request: PrefetchRequest): void {
    const index = this.queue.findIndex(
      req => this.getPriorityValue(req.priority) < this.getPriorityValue(request.priority)
    );

    if (index === -1) {
      this.queue.push(request);
    } else {
      this.queue.splice(index, 0, request);
    }
  }

  /**
   * Получить числовое значение приоритета
   */
  private getPriorityValue(priority: 'low' | 'high' | 'auto'): number {
    switch (priority) {
      case 'high': return 0;
      case 'auto': return 1;
      case 'low': return 2;
      default: return 2;
    }
  }

  /**
   * Обработать очередь запросов
   */
  private async processQueue(): Promise<void> {
    // Проверяем, можно ли запустить новые запросы
    while (
      this.activeRequests.size < this.maxConcurrent &&
      this.queue.length > 0
    ) {
      const request = this.queue.shift();
      if (!request) break;

      await this.executePrefetch(request);
    }
  }

  /**
   * Выполнить предзагрузку
   */
  private async executePrefetch(request: PrefetchRequest): Promise<void> {
    this.activeRequests.add(request.url);

    try {
      const response = await fetch(request.url, {
        method: 'GET',
        priority: request.priority,
        signal: request.controller?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const headers: Record<string, string> = {};

      // Собираем заголовки
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Сохраняем в кэш
      this.cacheManager.set(request.url, html, headers);

      if (getConfig().general.debug) {
        console.log(`✅ Prefetched: ${request.url} (${request.priority})`);
      }

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn(`⚠️ Prefetch failed for ${request.url}:`, error);
      }
    } finally {
      this.activeRequests.delete(request.url);
      // Продолжаем обработку очереди
      this.processQueue();
    }
  }

  /**
   * Отменить предзагрузку
   */
  cancelPrefetch(url: string): boolean {
    // Ищем запрос в очереди
    const queueIndex = this.queue.findIndex(req => req.url === url);
    if (queueIndex !== -1) {
      const request = this.queue[queueIndex];
      request.controller?.abort();
      this.queue.splice(queueIndex, 1);
      return true;
    }

    // Ищем активный запрос
    if (this.activeRequests.has(url)) {
      // Находим контроллер и отменяем
      for (const request of this.queue) {
        if (request.url === url && request.controller) {
          request.controller.abort();
          this.activeRequests.delete(url);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Предзагрузить несколько страниц
   */
  prefetchMultiple(urls: string[], priority: 'low' | 'high' | 'auto' = 'low'): void {
    if (!this.isEnabled) return;

    const limit = getPrefetchLimit();
    const urlsToPrefetch = limit === Infinity ? urls : urls.slice(0, limit);

    urlsToPrefetch.forEach(url => {
      this.prefetch(url, priority);
    });
  }

  /**
   * Предзагрузить страницы из навигации
   */
  prefetchNavigationLinks(container: HTMLElement = document.body): void {
    if (!this.isEnabled) return;

    const config = getConfig();
    
    // 1. Предзагружаем обычные ссылки
    const links = this.extractNavigationLinks(container);
    
    if (links.length > 0) {
      // Определяем приоритет
      const priority = isMobileDevice() ? 'low' : 'auto';
      
      // Предзагружаем ссылки
      this.prefetchMultiple(links, priority);

      if (config.general.debug) {
        console.log(`🔗 Prefetching ${links.length} navigation links`);
      }
    }

    // 2. Интеллектуальная предзагрузка на основе истории
    this.intelligentPrefetch.prefetchTopLevelPages();
    
    // 3. Предзагрузка дополнительных страниц для навигации
    this.intelligentPrefetch.prefetchNavigationExtraPages(container);
  }

  /**
   * Извлечь ссылки для предзагрузки из контейнера
   */
  private extractNavigationLinks(container: HTMLElement): string[] {
    const links: string[] = [];
    const config = getConfig();

    // Находим все ссылки, которые не имеют data-no-routing
    const linkElements = container.querySelectorAll<HTMLAnchorElement>(
      `a[href]:not([${config.general.dataNoRoutingAttribute}])`
    );

    for (const link of linkElements) {
      const href = link.getAttribute('href');
      if (!href) continue;

      // Пропускаем внешние ссылки, якоря и т.д.
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.includes('://')
      ) {
        continue;
      }

      // Нормализуем URL
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin) {
          links.push(url.pathname + url.search + url.hash);
        }
      } catch {
        // Пропускаем невалидные URL
      }
    }

    return links;
  }

  /**
   * Очистить очередь предзагрузки
   */
  clearQueue(): void {
    // Отменяем все запросы в очереди
    this.queue.forEach(request => {
      request.controller?.abort();
    });

    // Отменяем все активные запросы
    for (const url of this.activeRequests) {
      this.cancelPrefetch(url);
    }

    this.queue = [];
    this.activeRequests.clear();

    if (getConfig().general.debug) {
      console.log('🧹 Prefetch queue cleared');
    }
  }

  /**
   * Включить/выключить предзагрузку
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.clearQueue();
    }
  }

  /**
   * Получить статистику предзагрузки
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests.size,
      maxConcurrent: this.maxConcurrent,
      isEnabled: this.isEnabled,
      intelligentPrefetch: this.intelligentPrefetch.getStats(),
    };
  }

  /**
   * Получить менеджер интеллектуальной предзагрузки
   */
  getIntelligentPrefetch(): IntelligentPrefetch {
    return this.intelligentPrefetch;
  }

  /**
   * Очистить историю навигации
   */
  clearNavigationHistory(): void {
    this.intelligentPrefetch.clearHistory();
  }
}