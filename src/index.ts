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
}).catch(error => {
  console.error('❌ Failed to initialize AdvancedRouter:', error);
});

// Экспортируем для использования в других модулях
export { router };
export { AdvancedRouter } from '@core/AdvancedRouter';