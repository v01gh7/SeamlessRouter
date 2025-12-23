/**
 * Расширенный роутер с поддержкой всех новых функций
 */

import { getConfig, updateConfig, type RouterConfig, type AnimationType } from "./config";
import { CacheManager } from "./CacheModule";
import { PrefetchManager } from "./Prefetch";
import { AnimationManager } from "./Animations";
import { ServiceWorkerManager } from "./Offline";
import { EventEmitter } from "./utils/events";
import { navigate as baseNavigate } from "./Router/navigation";
import { 
  attachGlobalRoutesListenerEnhanced, 
  setPrefetchManager 
} from "./Router/attachRouteListenersEnhanced";
import { 
  navigateEnhanced,
  setAnimationManager,
  navigateWithAnimation 
} from "./Router/navigationEnhanced";

export class AdvancedRouter {
  private cacheManager: CacheManager;
  private prefetchManager: PrefetchManager;
  private animationManager: AnimationManager;
  private serviceWorkerManager: ServiceWorkerManager;
  private eventEmitter: EventEmitter;
  private isInitialized: boolean = false;
  private detachRouteListeners: (() => void) | null = null;

  constructor(config?: Partial<RouterConfig>) {
    // Обновляем конфигурацию если передана
    if (config) {
      updateConfig(config);
    }

    // Инициализируем менеджеры
    this.cacheManager = new CacheManager();
    this.prefetchManager = new PrefetchManager(this.cacheManager);
    this.animationManager = new AnimationManager();
    this.serviceWorkerManager = new ServiceWorkerManager();
    this.eventEmitter = new EventEmitter();

    // Добавляем CSS для анимаций
    this.injectAnimationStyles();

    // Логируем в debug режиме
    if (getConfig().general.debug) {
      console.log("🔧 AdvancedRouter initialized with managers");
      console.log("📊 Cache stats:", this.cacheManager.getStats());
    }
  }

  /**
   * Внедрить CSS стили для анимаций
   */
  private injectAnimationStyles(): void {
    // Загружаем CSS анимации
    this.loadAnimationStyles();
    
    // Добавляем инлайн стили
    if (document.head.querySelector('#router-animation-styles')) {
      return; // Стили уже добавлены
    }

    const style = document.createElement('style');
    style.id = 'router-animation-styles';
    style.textContent = this.createAnimationStyles();
    document.head.appendChild(style);
  }

  /**
   * Инициализировать роутер
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn("⚠️ AdvancedRouter already initialized");
      return;
    }

    // Регистрируем Service Worker если включен офлайн-режим
    if (getConfig().offline.enabled) {
      await this.serviceWorkerManager.register();
    }

    // Привязываем обработчики маршрутов с поддержкой предзагрузки
    this.attachEnhancedRouteListeners();

    // Предзагружаем начальные ссылки
    this.prefetchInitialLinks();

    this.isInitialized = true;
    this.eventEmitter.emit('init');
    
    console.log("🚀 AdvancedRouter initialized with all features");
  }

  /**
   * Привязать улучшенные обработчики маршрутов
   */
  private attachEnhancedRouteListeners(): void {
    const config = getConfig();
    
    // Используем улучшенную навигацию с анимациями
    const enhancedNavigate = (url: string) => {
      this.navigateTo(url);
    };

    // Устанавливаем менеджеры для обработчиков
    setPrefetchManager(this.prefetchManager);
    setAnimationManager(this.animationManager);

    // Привязываем улучшенные обработчики и сохраняем функцию отключения
    this.detachRouteListeners = attachGlobalRoutesListenerEnhanced(enhancedNavigate);
  }

  /**
   * Предзагрузить начальные ссылки
   */
  private prefetchInitialLinks(): void {
    if (!getConfig().prefetch.enabled) return;

    // Ждем немного чтобы DOM полностью загрузился
    setTimeout(() => {
      this.prefetchManager.prefetchNavigationLinks();
    }, 1000);

    // Также предзагружаем при загрузке страницы
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.prefetchManager.prefetchNavigationLinks();
      }, 500);
    });
  }

  /**
   * Навигация с поддержкой всех функций
   */
  async navigateTo(
    url: string, 
    options: {
      animationType?: string;
      skipAnimation?: boolean;
    } = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn("⚠️ Router not initialized, using base navigation");
      baseNavigate(url);
      return;
    }

    this.eventEmitter.emit('navigation:start', url, options);

    try {
      // Проверяем кэш
      const cached = this.cacheManager.get(url);
      
      if (cached) {
        // Используем кэшированную страницу с анимацией
        await this.loadFromCache(url, cached, options);
      } else {
        // Загружаем с сервера с анимацией
        await this.loadFromServer(url, options);
      }

      this.eventEmitter.emit('navigation:complete', url, options);
      
      // Предзагружаем ссылки с новой страницы
      this.prefetchManager.prefetchNavigationLinks(document.body);

    } catch (error) {
      console.error('❌ Navigation failed:', error);
      this.eventEmitter.emit('navigation:error', url, error, options);
      
      // Fallback к базовой навигации
      baseNavigate(url);
      
      // Перепривязываем обработчики после fallback
      setTimeout(() => {
        this.attachEnhancedRouteListeners();
      }, 100);
    }
  }

  /**
   * Загрузить страницу из кэша
   */
  private async loadFromCache(
    url: string, 
    cached: any, 
    options: { animationType?: string; skipAnimation?: boolean } = {}
  ): Promise<void> {
    if (getConfig().general.debug) {
      console.log(`🎯 Loading from cache: ${url}`);
    }

    this.eventEmitter.emit('cache:hit', url);
    
    // Парсим HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(cached.html, 'text/html');
    
    // Обновляем страницу с анимацией
    await this.updatePage(doc, url, true, options);
  }

  /**
   * Загрузить страницу с сервера
   */
  private async loadFromServer(
    url: string, 
    options: { animationType?: string; skipAnimation?: boolean } = {}
  ): Promise<void> {
    if (getConfig().general.debug) {
      console.log(`🌐 Loading from server: ${url}`);
    }

    this.eventEmitter.emit('cache:miss', url);

    try {
      const response = await fetch(url, { method: 'GET' });
      
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
      this.cacheManager.set(url, html, headers);

      // Парсим HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Обновляем страницу с анимацией
      await this.updatePage(doc, url, false, options);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Обновить страницу
   */
  private async updatePage(
    doc: Document, 
    url: string, 
    fromCache: boolean,
    options: { animationType?: string; skipAnimation?: boolean } = {}
  ): Promise<void> {
    // Отключаем старые обработчики перед обновлением страницы
    if (this.detachRouteListeners) {
      this.detachRouteListeners();
      this.detachRouteListeners = null;
    }

    // Обновляем history
    history.pushState({}, '', url);

    // Получаем старый и новый контент
    const oldContent = document.body;
    const newContent = doc.body.cloneNode(true) as HTMLElement;
    const container = document.body.parentElement!;

    // Определяем тип анимации
    const animationType = options.skipAnimation 
      ? undefined 
      : options.animationType || 'fade';

    // Если анимации отключены или пропущены
    if (!getConfig().animations.enabled || options.skipAnimation || !animationType) {
      // Простая замена без анимации
      container.replaceChild(newContent, oldContent);
      this.updateHead(doc.head);
      this.runScripts(newContent);
      
      // Перепривязываем обработчики для новой страницы
      this.attachEnhancedRouteListeners();
      
      this.eventEmitter.emit('page:updated', url, fromCache, { animated: false });
      return;
    }

    // Выполняем анимацию перехода
    await this.animationManager.animatePageTransition(
      oldContent,
      newContent,
      container,
      {
        type: animationType as any,
        duration: getConfig().animations.defaultDuration,
        onComplete: () => {
          // Обновляем head
          this.updateHead(doc.head);
          
          // Запускаем скрипты
          this.runScripts(newContent);
          
          // Перепривязываем обработчики для новой страницы
          this.attachEnhancedRouteListeners();
          
          this.eventEmitter.emit('page:updated', url, fromCache, { 
            animated: true, 
            animationType 
          });
        },
      }
    );
  }

  /**
   * Обновить head документа
   */
  private updateHead(newHead: HTMLHeadElement): void {
    const oldHead = document.head;
    
    // Обновляем title
    const newTitle = newHead.querySelector('title');
    const oldTitle = oldHead.querySelector('title');
    if (newTitle && oldTitle) {
      oldTitle.textContent = newTitle.textContent;
    }

    // Обновляем meta теги
    const metaTagsToUpdate = ['description', 'keywords', 'viewport'];
    metaTagsToUpdate.forEach(name => {
      const newMeta = newHead.querySelector(`meta[name="${name}"]`);
      const oldMeta = oldHead.querySelector(`meta[name="${name}"]`);
      
      if (newMeta && oldMeta) {
        oldMeta.setAttribute('content', newMeta.getAttribute('content') || '');
      } else if (newMeta && !oldMeta) {
        oldHead.appendChild(newMeta.cloneNode(true));
      }
    });
  }

  /**
   * Запустить скрипты
   */
  private runScripts(body: HTMLElement): void {
    const scripts = body.querySelectorAll('script');
    
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      
      // Копируем атрибуты
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Копируем содержимое
      if (!script.src && script.textContent) {
        newScript.textContent = script.textContent;
      }
      
      // Добавляем в документ
      document.body.appendChild(newScript);
      
      // Удаляем из body
      script.remove();
    });
  }

  /**
   * Получить менеджер кэша
   */
  getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Получить менеджер предзагрузки
   */
  getPrefetchManager(): PrefetchManager {
    return this.prefetchManager;
  }

  /**
   * Получить менеджер анимаций
   */
  getAnimationManager(): AnimationManager {
    return this.animationManager;
  }

  /**
   * Получить менеджер Service Worker
   */
  getServiceWorkerManager(): ServiceWorkerManager {
    return this.serviceWorkerManager;
  }

  /**
   * Подписаться на события
   */
  on(event: string, callback: (...args: any[]) => void): () => void {
    return this.eventEmitter.on(event, callback);
  }

  /**
   * Отписаться от событий
   */
  off(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Проверить инициализацию
   */
  isRouterInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Очистить кэш
   */
  clearCache(): void {
    this.cacheManager.clear();
    this.eventEmitter.emit('cache:cleared');
  }

  /**
   * Очистить очередь предзагрузки
   */
  clearPrefetchQueue(): void {
    this.prefetchManager.clearQueue();
    this.eventEmitter.emit('prefetch:cleared');
  }

  /**
   * Очистить историю навигации
   */
  clearNavigationHistory(): void {
    this.prefetchManager.clearNavigationHistory();
    this.eventEmitter.emit('navigation:history:cleared');
  }

  /**
   * Получить статистику интеллектуальной предзагрузки
   */
  getIntelligentPrefetchStats() {
    return this.prefetchManager.getIntelligentPrefetch().getStats();
  }

  /**
   * Включить/выключить интеллектуальную предзагрузку
   */
  setIntelligentPrefetchEnabled(enabled: boolean): void {
    this.prefetchManager.getIntelligentPrefetch().setEnabled(enabled);
    this.eventEmitter.emit('intelligent:prefetch:enabled', enabled);
  }

  /**
   * Включить/выключить офлайн-режим
   */
  setOfflineModeEnabled(enabled: boolean): void {
    this.serviceWorkerManager.setEnabled(enabled);
    this.eventEmitter.emit('offline:mode:enabled', enabled);
  }

  /**
   * Обновить Service Worker
   */
  async updateServiceWorker(): Promise<boolean> {
    const result = await this.serviceWorkerManager.update();
    this.eventEmitter.emit('service:worker:updated', result);
    return result;
  }

  /**
   * Очистить кэш Service Worker
   */
  async clearServiceWorkerCache(): Promise<boolean> {
    const result = await this.serviceWorkerManager.clearCache();
    this.eventEmitter.emit('service:worker:cache:cleared', result);
    return result;
  }

  /**
   * Получить статистику кэша Service Worker
   */
  async getServiceWorkerCacheStats(): Promise<any> {
    return await this.serviceWorkerManager.getCacheStats();
  }

  /**
   * Проверить поддержку офлайн-режима
   */
  isOfflineModeSupported(): boolean {
    return this.serviceWorkerManager.isServiceWorkerSupported();
  }

  /**
   * Проверить, включен ли офлайн-режим
   */
  isOfflineModeEnabled(): boolean {
    return this.serviceWorkerManager.isRegistered();
  }

  /**
   * Включить/выключить анимации
   */
  setAnimationsEnabled(enabled: boolean): void {
    const config = getConfig();
    updateConfig({
      animations: { ...config.animations, enabled }
    });
    this.eventEmitter.emit('animations:enabled', enabled);
  }

  /**
   * Установить тип анимации по умолчанию
   */
  setDefaultAnimationType(type: string): void {
    const config = getConfig();
    if (config.animations.animationTypes.includes(type as any)) {
      updateConfig({
        animations: { ...config.animations, defaultType: type as AnimationType }
      });
      this.eventEmitter.emit('animation:type:changed', type);
    } else {
      console.warn(`⚠️ Animation type "${type}" is not available`);
    }
  }

  /**
   * Получить доступные типы анимаций
   */
  getAvailableAnimationTypes(): string[] {
    return getConfig().animations.animationTypes;
  }

  /**
   * Навигация с конкретным типом анимации
   */
  navigateWithAnimation(
    url: string, 
    animationType: string, 
    skipAnimation: boolean = false
  ): Promise<void> {
    return this.navigateTo(url, { animationType, skipAnimation });
  }

  /**
   * Навигация без анимации
   */
  navigateWithoutAnimation(url: string): Promise<void> {
    return this.navigateTo(url, { skipAnimation: true });
  }

  /**
   * Проверить, включены ли анимации
   */
  areAnimationsEnabled(): boolean {
    return getConfig().animations.enabled;
  }

  /**
   * Проверить, выполняется ли анимация
   */
  isAnimationInProgress(): boolean {
    return this.animationManager.isAnimationInProgress();
  }

  /**
   * Отменить текущую анимацию
   */
  async cancelCurrentAnimation(): Promise<void> {
    await this.animationManager.cancelCurrentAnimation();
    this.eventEmitter.emit('animation:cancelled');
  }

  /**
   * Загрузить CSS стили анимаций
   */
  private loadAnimationStyles(): void {
    // Проверяем, не загружены ли стили уже
    if (document.head.querySelector('link[href*="animations.css"]')) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/animations.css';
    link.onload = () => console.log('✅ Animation styles loaded');
    link.onerror = () => console.warn('⚠️ Failed to load animation styles');
    
    document.head.appendChild(link);
  }

  /**
   * Создать CSS стили для анимаций
   */
  private createAnimationStyles(): string {
    return `
      /* Базовые стили будут загружены из animations.css */
      .router-animation-old,
      .router-animation-new {
        will-change: transform, opacity;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }

      @media (prefers-reduced-motion: reduce) {
        .router-animation-old,
        .router-animation-new {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
  }
}