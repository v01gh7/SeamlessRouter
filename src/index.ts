import { AdvancedRouter } from '@core/AdvancedRouter'
import { initGlobalSandbox } from '@core/Sandbox/sandbox'

// Инициализируем расширенный роутер с настройками по умолчанию
const router = new AdvancedRouter({
  general: {
    debug: process.env.NODE_ENV === 'development',
    dataNoRoutingAttribute: 'data-no-routing',
  },
});

// Инициализируем sandbox для скриптов
initGlobalSandbox();

// Инициализируем роутер асинхронно
router.init().then(() => {
  console.log('✅ AdvancedRouter fully initialized');
  
  // Добавляем глобальные функции для управления из консоли
  if (typeof window !== 'undefined') {
    // Очистить весь кэш роутера
    (window as any).clearRouterCache = () => {
      router.clearCache();
      console.log('🧹 Router cache cleared');
      return 'Router cache cleared successfully';
    };
    
    // Очистить очередь предзагрузки
    (window as any).clearPrefetchQueue = () => {
      router.clearPrefetchQueue();
      console.log('🧹 Prefetch queue cleared');
      return 'Prefetch queue cleared successfully';
    };
    
    // Очистить историю навигации
    (window as any).clearNavigationHistory = () => {
      router.clearNavigationHistory();
      console.log('🧹 Navigation history cleared');
      return 'Navigation history cleared successfully';
    };
    
    // Очистить кэш Service Worker
    (window as any).clearServiceWorkerCache = async () => {
      const result = await router.clearServiceWorkerCache();
      console.log('🧹 Service Worker cache cleared:', result);
      return `Service Worker cache cleared: ${result}`;
    };
    
    // Получить статистику кэша
    (window as any).getCacheStats = () => {
      const stats = router.getCacheManager().getStats();
      console.log('📊 Cache stats:', stats);
      return stats;
    };
    
    // Получить статистику предзагрузки
    (window as any).getPrefetchStats = () => {
      const stats = router.getPrefetchManager().getStats();
      console.log('📊 Prefetch stats:', stats);
      return stats;
    };
    
    // Получить все URL в кэше
    (window as any).getCachedUrls = () => {
      const urls = router.getCacheManager().getUrls();
      console.log('📋 Cached URLs:', urls);
      return urls;
    };
    
    // Очистить ВСЁ (комплексная очистка)
    (window as any).clearAllRouterData = async () => {
      console.log('🧹 Starting comprehensive router data cleanup...');
      
      router.clearCache();
      console.log('✅ Router cache cleared');
      
      router.clearPrefetchQueue();
      console.log('✅ Prefetch queue cleared');
      
      router.clearNavigationHistory();
      console.log('✅ Navigation history cleared');
      
      try {
        const swResult = await router.clearServiceWorkerCache();
        console.log('✅ Service Worker cache cleared:', swResult);
      } catch (error) {
        console.warn('⚠️ Could not clear Service Worker cache:', error);
      }
      
      console.log('🎉 All router data cleared successfully');
      return 'All router data cleared successfully';
    };
    
    console.log('🔧 Global router management functions added to window object');
    console.log('📋 Available functions:');
    console.log('  - clearRouterCache() - Clear router cache');
    console.log('  - clearPrefetchQueue() - Clear prefetch queue');
    console.log('  - clearNavigationHistory() - Clear navigation history');
    console.log('  - clearServiceWorkerCache() - Clear Service Worker cache');
    console.log('  - clearAllRouterData() - Clear ALL router data');
    console.log('  - getCacheStats() - Get cache statistics');
    console.log('  - getPrefetchStats() - Get prefetch statistics');
    console.log('  - getCachedUrls() - Get all cached URLs');
  }
}).catch(error => {
  console.error('❌ Failed to initialize AdvancedRouter:', error);
});

// Экспортируем для использования в других модулях
export { router };
export { AdvancedRouter } from '@core/AdvancedRouter';