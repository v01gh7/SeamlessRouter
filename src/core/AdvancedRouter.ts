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
    // Проверяем, не добавлены ли стили уже
    if (document.head.querySelector('#router-animation-styles')) {
      return; // Стили уже добавлены
    }

    const style = document.createElement('style');
    style.id = 'router-animation-styles';
    style.setAttribute('data-keep', '');
    style.setAttribute('data-skip', '');
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
    
    // Собираем все элементы из нового head, которые нужно сохранить
    const elementsToKeep = new Set<Element>();
    
    // 1. Сначала находим элементы, которые должны остаться (с data-keep или data-skip)
    Array.from(oldHead.children).forEach(element => {
      if (element.hasAttribute('data-keep') || element.hasAttribute('data-skip')) {
        elementsToKeep.add(element);
      }
    });
    
    // 2. Удаляем все старые элементы, кроме тех что нужно сохранить
    Array.from(oldHead.children).forEach(element => {
      if (!elementsToKeep.has(element)) {
        oldHead.removeChild(element);
      }
    });
    
    // 3. Добавляем все новые элементы, кроме тех что уже есть с data-keep/data-skip
    Array.from(newHead.children).forEach(newElement => {
      // Проверяем, есть ли уже такой элемент с data-keep/data-skip
      const shouldSkip = newElement.hasAttribute('data-skip');
      const shouldKeep = newElement.hasAttribute('data-keep');
      
      if (shouldSkip) {
        // Элементы с data-skip не добавляем
        return;
      }
      
      if (shouldKeep) {
        // Для элементов с data-keep проверяем, не добавлен ли уже
        const existingElement = oldHead.querySelector(`[data-keep][id="${newElement.id}"]`) || 
                               oldHead.querySelector(`[data-keep][src="${newElement.getAttribute('src')}"]`);
        if (!existingElement) {
          oldHead.appendChild(newElement.cloneNode(true));
        }
      } else {
        // Обычные элементы добавляем всегда
        oldHead.appendChild(newElement.cloneNode(true));
      }
    });
    
    // 4. Убедимся, что title всегда обновляется
    const newTitle = newHead.querySelector('title');
    const oldTitle = oldHead.querySelector('title');
    if (newTitle && oldTitle) {
      oldTitle.textContent = newTitle.textContent;
    } else if (newTitle && !oldTitle) {
      oldHead.appendChild(newTitle.cloneNode(true));
    }
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
   * Создать CSS стили для анимаций
   */
  private createAnimationStyles(): string {
    return `
      /* Базовые стили для анимированных элементов */
      .router-animation-old,
      .router-animation-new {
        will-change: transform, opacity;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform-style: preserve-3d;
      }

      /* Анимация fade */
      @keyframes router-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes router-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      .router-animation-fade {
        animation-timing-function: ease-in-out;
      }

      /* Анимация slide-left */
      @keyframes router-slide-left-in {
        from { 
          transform: translateX(100%);
          opacity: 0;
        }
        to { 
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes router-slide-left-out {
        from { 
          transform: translateX(0);
          opacity: 1;
        }
        to { 
          transform: translateX(-100%);
          opacity: 0;
        }
      }

      .router-animation-slide-left {
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Анимация slide-right */
      @keyframes router-slide-right-in {
        from { 
          transform: translateX(-100%);
          opacity: 0;
        }
        to { 
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes router-slide-right-out {
        from { 
          transform: translateX(0);
          opacity: 1;
        }
        to { 
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .router-animation-slide-right {
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Анимация slide-up */
      @keyframes router-slide-up-in {
        from { 
          transform: translateY(100%);
          opacity: 0;
        }
        to { 
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes router-slide-up-out {
        from { 
          transform: translateY(0);
          opacity: 1;
        }
        to { 
          transform: translateY(-100%);
          opacity: 0;
        }
      }

      .router-animation-slide-up {
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Анимация slide-down */
      @keyframes router-slide-down-in {
        from { 
          transform: translateY(-100%);
          opacity: 0;
        }
        to { 
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes router-slide-down-out {
        from { 
          transform: translateY(0);
          opacity: 1;
        }
        to { 
          transform: translateY(100%);
          opacity: 0;
        }
      }

      .router-animation-slide-down {
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Анимация collapse */
      @keyframes router-collapse-in {
        from { 
          transform: scale(1.2);
          opacity: 0;
        }
        to { 
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes router-collapse-out {
        from { 
          transform: scale(1);
          opacity: 1;
        }
        to { 
          transform: scale(0.8);
          opacity: 0;
        }
      }

      .router-animation-collapse {
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Анимация diagonal */
      @keyframes router-diagonal-in {
        from { 
          transform: translate(-100%, -100%) scale(1.2);
          opacity: 0;
        }
        to { 
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
      }

      @keyframes router-diagonal-out {
        from { 
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        to { 
          transform: translate(100%, 100%) scale(0.8);
          opacity: 0;
        }
      }

      .router-animation-diagonal {
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Классы для ручного управления анимациями */
      .router-animate-fade {
        animation: router-fade-in 0.3s ease-in-out;
      }

      .router-animate-slide-left {
        animation: router-slide-left-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .router-animate-slide-right {
        animation: router-slide-right-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .router-animate-slide-up {
        animation: router-slide-up-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .router-animate-slide-down {
        animation: router-slide-down-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .router-animate-collapse {
        animation: router-collapse-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .router-animate-diagonal {
        animation: router-diagonal-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Поддержка prefers-reduced-motion */
      @media (prefers-reduced-motion: reduce) {
        .router-animation-old,
        .router-animation-new,
        .router-animate-fade,
        .router-animate-slide-left,
        .router-animate-slide-right,
        .router-animate-slide-up,
        .router-animate-slide-down,
        .router-animate-collapse,
        .router-animate-diagonal {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* Утилитарные классы для анимаций */
      .router-animation-container {
        position: relative;
        overflow: hidden;
      }

      .router-animation-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      /* Индикатор загрузки */
      .router-loading-indicator {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        z-index: 9999;
        transform-origin: 0 50%;
        animation: router-loading 1s infinite;
      }

      @keyframes router-loading {
        0% { transform: scaleX(0); }
        50% { transform: scaleX(0.5); }
        100% { transform: scaleX(1); }
      }

      /* Плавный скролл после навигации */
      .router-smooth-scroll {
        scroll-behavior: smooth;
      }

      /* Отключение анимаций для пользователей с prefers-reduced-motion */
      @media (prefers-reduced-motion: reduce) {
        .router-smooth-scroll {
          scroll-behavior: auto;
        }
        
        .router-loading-indicator {
          display: none;
        }
      }
    `;
  }
}