/**
 * Интеллектуальная предзагрузка на основе поведения пользователя
 */

import { getConfig, isMobileDevice, getPrefetchLimit } from "../config";
import { PrefetchManager } from "./PrefetchManager";

export interface NavigationPattern {
  from: string;
  to: string;
  count: number;
  timestamp: number;
}

export class IntelligentPrefetch {
  private prefetchManager: PrefetchManager;
  private navigationHistory: NavigationPattern[] = [];
  private maxHistorySize: number = 100;
  private isEnabled: boolean = true;

  constructor(prefetchManager: PrefetchManager) {
    this.prefetchManager = prefetchManager;
    this.isEnabled = getConfig().prefetch.enabled;
    
    // Загружаем историю из localStorage
    this.loadNavigationHistory();
    
    // Слушаем события навигации
    this.setupNavigationTracking();
  }

  /**
   * Загрузить историю навигации из localStorage
   */
  private loadNavigationHistory(): void {
    try {
      const stored = localStorage.getItem('router_navigation_history');
      if (stored) {
        this.navigationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load navigation history:', error);
      this.navigationHistory = [];
    }
  }

  /**
   * Сохранить историю навигации в localStorage
   */
  private saveNavigationHistory(): void {
    try {
      localStorage.setItem('router_navigation_history', JSON.stringify(this.navigationHistory));
    } catch (error) {
      console.warn('Failed to save navigation history:', error);
    }
  }

  /**
   * Настроить отслеживание навигации
   */
  private setupNavigationTracking(): void {
    if (!this.isEnabled) return;

    // Отслеживаем переходы по истории
    let lastUrl = window.location.pathname;
    
    const trackNavigation = () => {
      const currentUrl = window.location.pathname;
      
      if (currentUrl !== lastUrl) {
        this.recordNavigation(lastUrl, currentUrl);
        lastUrl = currentUrl;
        
        // Предзагружаем на основе паттернов
        this.prefetchBasedOnPatterns(currentUrl);
      }
    };

    // Отслеживаем popstate (назад/вперед по истории)
    window.addEventListener('popstate', trackNavigation);
    
    // Отслеживаем pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(trackNavigation, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(trackNavigation, 0);
    };
  }

  /**
   * Записать переход в историю
   */
  private recordNavigation(from: string, to: string): void {
    // Находим существующий паттерн
    const existingPattern = this.navigationHistory.find(
      pattern => pattern.from === from && pattern.to === to
    );

    if (existingPattern) {
      // Обновляем существующий паттерн
      existingPattern.count++;
      existingPattern.timestamp = Date.now();
    } else {
      // Добавляем новый паттерн
      this.navigationHistory.push({
        from,
        to,
        count: 1,
        timestamp: Date.now(),
      });

      // Ограничиваем размер истории
      if (this.navigationHistory.length > this.maxHistorySize) {
        // Удаляем самые старые записи
        this.navigationHistory.sort((a, b) => b.timestamp - a.timestamp);
        this.navigationHistory = this.navigationHistory.slice(0, this.maxHistorySize);
      }
    }

    // Сохраняем историю
    this.saveNavigationHistory();
  }

  /**
   * Предзагрузить на основе паттернов навигации
   */
  private prefetchBasedOnPatterns(currentUrl: string): void {
    if (!this.isEnabled) return;

    const config = getConfig();
    const isMobile = isMobileDevice();

    // Находим наиболее вероятные следующие страницы
    const likelyNextPages = this.getLikelyNextPages(currentUrl);
    
    if (likelyNextPages.length === 0) return;

    // Определяем сколько страниц предзагружать
    let prefetchLimit: number;
    
    if (isMobile) {
      prefetchLimit = config.prefetch.mobilePrefetchLimit;
    } else {
      prefetchLimit = config.prefetch.desktopPrefetchAll ? 
        likelyNextPages.length : 
        config.prefetch.mobilePrefetchLimit;
    }

    // Предзагружаем наиболее вероятные страницы
    const pagesToPrefetch = likelyNextPages.slice(0, prefetchLimit);
    
    pagesToPrefetch.forEach(page => {
      this.prefetchManager.prefetch(page.url, 'auto');
    });

    if (config.general.debug && pagesToPrefetch.length > 0) {
      console.log(`🎯 Intelligent prefetch for ${currentUrl}:`, pagesToPrefetch.map(p => p.url));
    }
  }

  /**
   * Получить наиболее вероятные следующие страницы
   */
  private getLikelyNextPages(currentUrl: string): Array<{url: string, probability: number}> {
    // Фильтруем паттерны, начинающиеся с текущей страницы
    const patternsFromCurrent = this.navigationHistory.filter(
      pattern => pattern.from === currentUrl
    );

    if (patternsFromCurrent.length === 0) {
      return [];
    }

    // Сортируем по частоте и свежести
    const scoredPatterns = patternsFromCurrent.map(pattern => {
      // Баллы за частоту (чем больше переходов, тем выше)
      const frequencyScore = pattern.count;
      
      // Баллы за свежесть (чем новее, тем выше)
      const age = Date.now() - pattern.timestamp;
      const recencyScore = Math.max(0, 1 - (age / (30 * 24 * 60 * 60 * 1000))); // 30 дней
      
      // Итоговый балл
      const totalScore = frequencyScore * (1 + recencyScore);
      
      return {
        url: pattern.to,
        probability: totalScore,
      };
    });

    // Сортируем по вероятности
    return scoredPatterns.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Предзагрузить страницы верхнего уровня (для начальной загрузки)
   */
  prefetchTopLevelPages(): void {
    if (!this.isEnabled) return;

    const config = getConfig();
    const isMobile = isMobileDevice();

    // Собираем все уникальные страницы из истории
    const allPages = new Set<string>();
    this.navigationHistory.forEach(pattern => {
      allPages.add(pattern.from);
      allPages.add(pattern.to);
    });

    // Добавляем важные страницы из конфига
    config.cache.alwaysCache.forEach(page => {
      allPages.add(page);
    });

    const pages = Array.from(allPages);
    
    if (pages.length === 0) return;

    // Определяем сколько страниц предзагружать
    let prefetchLimit: number;
    
    if (isMobile) {
      prefetchLimit = Math.min(config.prefetch.mobilePrefetchLimit, pages.length);
    } else {
      prefetchLimit = config.prefetch.desktopPrefetchAll ? 
        pages.length : 
        config.prefetch.mobilePrefetchLimit;
    }

    // Предзагружаем страницы
    const pagesToPrefetch = pages.slice(0, prefetchLimit);
    
    pagesToPrefetch.forEach(page => {
      this.prefetchManager.prefetch(page, 'low');
    });

    if (config.general.debug && pagesToPrefetch.length > 0) {
      console.log(`🏠 Prefetching top-level pages:`, pagesToPrefetch);
    }
  }

  /**
   * Предзагрузить дополнительные страницы для навигации (категории, пагинация)
   */
  prefetchNavigationExtraPages(container: HTMLElement = document.body): void {
    if (!this.isEnabled) return;

    const config = getConfig();
    const extraPages = config.prefetch.navigationExtraPages;
    
    if (extraPages <= 0) return;

    // Находим элементы навигации (пагинация, next/prev ссылки)
    const navElements = container.querySelectorAll<HTMLAnchorElement>(
      'a[href*="page"], a[href*="p="], a[rel="next"], a[rel="prev"]'
    );

    const urls: string[] = [];
    
    navElements.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      // Пропускаем внешние ссылки, якоря и т.д.
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.includes('://')
      ) {
        return;
      }

      // Нормализуем URL
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin) {
          urls.push(url.pathname + url.search + url.hash);
        }
      } catch {
        // Пропускаем невалидные URL
      }
    });

    if (urls.length === 0) return;

    // Предзагружаем дополнительные страницы
    const pagesToPrefetch = urls.slice(0, extraPages);
    
    pagesToPrefetch.forEach(url => {
      this.prefetchManager.prefetch(url, 'auto');
    });

    if (config.general.debug && pagesToPrefetch.length > 0) {
      console.log(`📄 Prefetching ${pagesToPrefetch.length} extra navigation pages`);
    }
  }

  /**
   * Очистить историю навигации
   */
  clearHistory(): void {
    this.navigationHistory = [];
    localStorage.removeItem('router_navigation_history');
    
    if (getConfig().general.debug) {
      console.log('🧹 Navigation history cleared');
    }
  }

  /**
   * Получить статистику истории навигации
   */
  getStats() {
    return {
      totalPatterns: this.navigationHistory.length,
      uniqueFromPages: new Set(this.navigationHistory.map(p => p.from)).size,
      uniqueToPages: new Set(this.navigationHistory.map(p => p.to)).size,
      totalTransitions: this.navigationHistory.reduce((sum, p) => sum + p.count, 0),
    };
  }

  /**
   * Включить/выключить интеллектуальную предзагрузку
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}