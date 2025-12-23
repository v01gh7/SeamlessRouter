/**
 * Конфигурация расширенных функций роутера
 */

export interface RouterConfig {
  // Предзагрузка страниц
  prefetch: {
    enabled: boolean;
    mobileThreshold: number; // Ширина экрана для мобильных устройств (px)
    desktopPrefetchAll: boolean; // На ПК загружать все первые страницы
    mobilePrefetchLimit: number; // Лимит предзагрузки на мобилке
    navigationExtraPages: number; // +N страниц в категориях с навигацией
    hoverDelay: number; // Задержка перед предзагрузкой при наведении (ms)
    touchDelay: number; // Задержка перед предзагрузкой при тапе (ms)
  };

  // Интеллектуальное кэширование
  cache: {
    enabled: boolean;
    maxSizeMB: number; // Максимальный размер кэша в МБ
    maxEntries: number; // Максимальное количество записей
    alwaysCache: string[]; // Страницы, которые всегда должны быть в кэше
    checkLastModified: boolean; // Проверять last-modified тег
    ttlHours: number; // Время жизни кэша по умолчанию (часы)
  };

  // Офлайн-режим
  offline: {
    enabled: boolean;
    showOfflineIndicator: boolean; // Показывать индикатор офлайн-режима
    offlinePageUrl: string; // URL страницы-заглушки при офлайне
    cacheMedia: boolean; // Кэшировать медиа-файлы (false по умолчанию)
  };

  // Расширенные анимации
  animations: {
    enabled: boolean;
    defaultDuration: number; // Длительность анимации по умолчанию (ms)
    respectReducedMotion: boolean; // Учитывать prefers-reduced-motion
    animationTypes: AnimationType[]; // Доступные типы анимаций
    defaultType?: AnimationType; // Тип анимации по умолчанию
  };

  // Общие настройки
  general: {
    debug: boolean; // Режим отладки
    dataNoRoutingAttribute: string; // Атрибут для отключения роутинга
  };
}

export type AnimationType = 
  | 'fade' 
  | 'slide-left' 
  | 'slide-right' 
  | 'slide-up' 
  | 'slide-down'
  | 'collapse'
  | 'diagonal'
  | 'mask-circle'
  | 'mask-gradient';

// Конфигурация по умолчанию
export const defaultConfig: RouterConfig = {
  prefetch: {
    enabled: true,
    mobileThreshold: 768, // Ширина экрана меньше 768px = мобильное устройство
    desktopPrefetchAll: true, // На ПК загружать все первые страницы
    mobilePrefetchLimit: 3, // На мобилке только 3 первые страницы
    navigationExtraPages: 2, // +2 страницы в категориях с навигацией
    hoverDelay: 300, // 300ms задержка перед предзагрузкой
    touchDelay: 100, // 100ms задержка перед предзагрузкой
  },

  cache: {
    enabled: true,
    maxSizeMB: 30, // 30 МБ максимальный размер кэша
    maxEntries: 100, // Максимум 100 записей
    alwaysCache: ['/', '/index.html', '/contacts.html', '/about.html'], // Важные страницы
    checkLastModified: true, // Проверять last-modified тег
    ttlHours: 24, // 24 часа по умолчанию
  },

  offline: {
    enabled: true,
    showOfflineIndicator: true,
    offlinePageUrl: '/offline.html',
    cacheMedia: false, // Не кэшируем видео/картинки
  },

  animations: {
    enabled: true,
    defaultDuration: 300, // 300ms длительность анимации
    respectReducedMotion: true,
    animationTypes: ['fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'collapse', 'diagonal', 'mask-circle', 'mask-gradient'],
    defaultType: 'fade', // Тип анимации по умолчанию
  },

  general: {
    debug: process.env.NODE_ENV === 'development',
    dataNoRoutingAttribute: 'data-no-routing',
  },
};

// Глобальная конфигурация
let currentConfig: RouterConfig = { ...defaultConfig };

/**
 * Получить текущую конфигурацию
 */
export function getConfig(): RouterConfig {
  return { ...currentConfig };
}

/**
 * Обновить конфигурацию
 */
export function updateConfig(newConfig: Partial<RouterConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
    prefetch: { ...currentConfig.prefetch, ...newConfig.prefetch },
    cache: { ...currentConfig.cache, ...newConfig.cache },
    offline: { ...currentConfig.offline, ...newConfig.offline },
    animations: { ...currentConfig.animations, ...newConfig.animations },
    general: { ...currentConfig.general, ...newConfig.general },
  };
}

/**
 * Сбросить конфигурацию к значениям по умолчанию
 */
export function resetConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Проверить, является ли устройство мобильным
 */
export function isMobileDevice(): boolean {
  return window.innerWidth < getConfig().prefetch.mobileThreshold;
}

/**
 * Получить лимит предзагрузки для текущего устройства
 */
export function getPrefetchLimit(): number {
  const config = getConfig();
  if (!config.prefetch.enabled) return 0;
  
  if (isMobileDevice()) {
    return config.prefetch.mobilePrefetchLimit;
  }
  
  return config.prefetch.desktopPrefetchAll ? Infinity : config.prefetch.mobilePrefetchLimit;
}