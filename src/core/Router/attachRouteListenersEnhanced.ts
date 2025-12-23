/**
 * Улучшенная версия attachRouteListeners с поддержкой предзагрузки
 */

import { ROUTE_SELECTORS } from "@core/utils";
import { getConfig } from "../config";

// Глобальная переменная для менеджера предзагрузки
let prefetchManager: any = null;

/**
 * Установить менеджер предзагрузки
 */
export function setPrefetchManager(manager: any): void {
  prefetchManager = manager;
}

const getHrefForRoute = (element: HTMLElement): string | null => {
  let response: string | null = null;

  if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('href')) {
    const anchor = element as HTMLAnchorElement;
    if (anchor.target === '_blank') return null;
    response = anchor.getAttribute('href');
  } else if (element.tagName.toLowerCase() === 'button' && element.hasAttribute('data-router-link')) {
    response = element.getAttribute('data-router-link');
  }

  if (!response) return null;

  // Нормализуем URL
  try {
    const url = new URL(response, document.location.origin);

    // Пропускаем только если тот же домен (чтобы не ловить внешние ссылки)
    if (url.origin !== document.location.origin) {
      return null;
    }

    return url.pathname + url.search + url.hash;
  } catch {
    return null; // если response — невалидный URL
  }
};

/**
 * Проверить, нужно ли игнорировать элемент из-за data-no-routing
 */
const shouldIgnoreElement = (element: HTMLElement): boolean => {
  const config = getConfig();
  let currentElement: Element | null = element;
  
  while (currentElement) {
    if (currentElement.hasAttribute(config.general.dataNoRoutingAttribute)) {
      return true;
    }
    currentElement = currentElement.parentElement;
  }
  
  return false;
};





export const attachGlobalRoutesListenerEnhanced = (onNavigate: (url: string) => void) => {
  const handlerMap = new WeakMap<HTMLElement, (e: Event) => void>();
  const prefetchHandlerMap = new WeakMap<HTMLElement, {
    mouseenter: (e: Event) => void;
    mouseleave: (e: Event) => void;
    touchstart: (e: Event) => void;
    touchend: (e: Event) => void;
    touchcancel: (e: Event) => void;
  }>();
  const prefetchTimeouts = new WeakMap<HTMLElement, number>();
  const prefetchControllers = new WeakMap<HTMLElement, AbortController>();
  
  const config = getConfig();

  /**
   * Обработчик для предзагрузки при наведении
   */
  const handleMouseEnter = (e: Event): void => {
    if (!prefetchManager) return;
    
    const target = e.currentTarget as HTMLElement;
    const href = getHrefForRoute(target);
    
    if (!href || shouldIgnoreElement(target)) return;
    
    if (!config.prefetch.enabled) return;
    
    // Устанавливаем таймаут для предзагрузки
    const timeout = window.setTimeout(() => {
      if (prefetchManager) {
        prefetchManager.prefetch(href, 'low');
      }
    }, config.prefetch.hoverDelay);
    
    prefetchTimeouts.set(target, timeout);
  };

  /**
   * Обработчик для отмены предзагрузки
   */
  const handleMouseLeave = (e: Event): void => {
    const target = e.currentTarget as HTMLElement;
    
    // Отменяем таймаут
    const timeout = prefetchTimeouts.get(target);
    if (timeout) {
      window.clearTimeout(timeout);
      prefetchTimeouts.delete(target);
    }
    
    // Отменяем активную предзагрузку если есть
    if (prefetchManager) {
      const href = getHrefForRoute(target);
      if (href) {
        prefetchManager.cancelPrefetch(href);
      }
    }
  };

  /**
   * Обработчик для предзагрузки при тапе (мобильные устройства)
   */
  const handleTouchStart = (e: Event): void => {
    if (!prefetchManager) return;
    
    const target = e.currentTarget as HTMLElement;
    const href = getHrefForRoute(target);
    
    if (!href || shouldIgnoreElement(target)) return;
    
    if (!config.prefetch.enabled) return;
    
    // На мобильных устройствах предзагружаем сразу, но с небольшой задержкой
    const timeout = window.setTimeout(() => {
      if (prefetchManager) {
        prefetchManager.prefetch(href, 'auto');
      }
    }, config.prefetch.touchDelay);
    
    prefetchTimeouts.set(target, timeout);
  };

  /**
   * Обработчик для отмены предзагрузки при тапе
   */
  const handleTouchEnd = (e: Event): void => {
    const target = e.currentTarget as HTMLElement;
    
    // Отменяем таймаут
    const timeout = prefetchTimeouts.get(target);
    if (timeout) {
      window.clearTimeout(timeout);
      prefetchTimeouts.delete(target);
    }
  };

  const createClickHandler = (onNavigate: (url: string) => void) => {
    return (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      
      // Проверяем data-no-routing
      if (shouldIgnoreElement(target)) {
        return; // Пропускаем обработку
      }
      
      const href = getHrefForRoute(target);
      if (!href) return;

      e.preventDefault();
      e.stopPropagation();
      onNavigate(href);
    };
  };

  const addListenersToElements = (elements: NodeListOf<Element> | Element[]) => {
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        const href = getHrefForRoute(el);
        if (href && !shouldIgnoreElement(el)) {
          // Обработчик клика
          const clickHandler = createClickHandler(onNavigate);
          el.addEventListener('click', clickHandler);
          handlerMap.set(el, clickHandler);
          
          // Обработчики предзагрузки если включено
          if (config.prefetch.enabled && prefetchManager) {
            const prefetchHandlers = {
              mouseenter: handleMouseEnter,
              mouseleave: handleMouseLeave,
              touchstart: handleTouchStart,
              touchend: handleTouchEnd,
              touchcancel: handleTouchEnd,
            };
            
            el.addEventListener('mouseenter', prefetchHandlers.mouseenter);
            el.addEventListener('mouseleave', prefetchHandlers.mouseleave);
            el.addEventListener('touchstart', prefetchHandlers.touchstart);
            el.addEventListener('touchend', prefetchHandlers.touchend);
            el.addEventListener('touchcancel', prefetchHandlers.touchcancel);
            
            prefetchHandlerMap.set(el, prefetchHandlers);
          }
        }
      }
    });
  };

  const removeListenersFromElements = (elements: NodeListOf<Element> | Element[]) => {
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        // Удаляем обработчик клика
        const clickHandler = handlerMap.get(el);
        if (clickHandler) {
          el.removeEventListener('click', clickHandler);
          handlerMap.delete(el);
        }
        
        // Удаляем обработчики предзагрузки
        const prefetchHandlers = prefetchHandlerMap.get(el);
        if (prefetchHandlers) {
          el.removeEventListener('mouseenter', prefetchHandlers.mouseenter);
          el.removeEventListener('mouseleave', prefetchHandlers.mouseleave);
          el.removeEventListener('touchstart', prefetchHandlers.touchstart);
          el.removeEventListener('touchend', prefetchHandlers.touchend);
          el.removeEventListener('touchcancel', prefetchHandlers.touchcancel);
          prefetchHandlerMap.delete(el);
        }
        
        // Отменяем таймауты предзагрузки
        const timeout = prefetchTimeouts.get(el);
        if (timeout) {
          window.clearTimeout(timeout);
          prefetchTimeouts.delete(el);
        }
      }
    });
  };

  // Инициализация
  const initialLinks = document.querySelectorAll(ROUTE_SELECTORS.join(', '));
  addListenersToElements(initialLinks);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      // Обработка добавленных узлов
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          if (node.matches && node.matches(ROUTE_SELECTORS.join(', '))) {
            addListenersToElements([node]);
          }
          const links = node.querySelectorAll?.(ROUTE_SELECTORS.join(', '));
          if (links) {
            addListenersToElements(links);
          }
        }
      });

      // Обработка удаленных узлов
      mutation.removedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          if (node.matches && node.matches(ROUTE_SELECTORS.join(', '))) {
            removeListenersFromElements([node]);
          }
          const links = node.querySelectorAll?.(ROUTE_SELECTORS.join(', '));
          if (links) {
            removeListenersFromElements(links);
          }
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Возвращаем функцию для отключения наблюдателя
  return () => {
    observer.disconnect();
    
    // Удаляем все обработчики
    const allElements = document.querySelectorAll(ROUTE_SELECTORS.join(', '));
    removeListenersFromElements(allElements);
    
    // Очищаем таймауты предзагрузки
    // Note: WeakMap автоматически очищается когда элементы удаляются из DOM
    // Мы не можем очистить WeakMap полностью, но можем очистить таймауты
    // для элементов которые еще существуют
    const elements = document.querySelectorAll(ROUTE_SELECTORS.join(', '));
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        const timeout = prefetchTimeouts.get(el);
        if (timeout) {
          window.clearTimeout(timeout);
          prefetchTimeouts.delete(el);
        }
      }
    });
  };
};