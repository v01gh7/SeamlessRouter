import { attachGlobalRoutesListener } from "./Router/attachRouteListeners";
import { navigate } from "./Router/navigation";
import { getConfig, updateConfig, type RouterConfig } from "./config";
import { EventEmitter } from "./utils/events";

export class Router {
  private eventEmitter: EventEmitter;
  private isInitialized: boolean = false;

  constructor(config?: Partial<RouterConfig>) {
    this.eventEmitter = new EventEmitter();
    
    // Обновляем конфигурацию если передана
    if (config) {
      updateConfig(config);
    }

    // Логируем конфигурацию в debug режиме
    if (getConfig().general.debug) {
      console.log("🔧 Router config:", getConfig());
    }
  }

  init() {
    if (this.isInitialized) {
      console.warn("⚠️ Router already initialized");
      return;
    }

    attachGlobalRoutesListener(navigate);
    this.isInitialized = true;
    
    this.eventEmitter.emit('init');
    console.log("🚀 Router initialized with advanced features");
  }

  /**
   * Получить текущую конфигурацию
   */
  getConfig(): RouterConfig {
    return getConfig();
  }

  /**
   * Обновить конфигурацию
   */
  updateConfig(config: Partial<RouterConfig>): void {
    updateConfig(config);
    this.eventEmitter.emit('config:updated', getConfig());
  }

  /**
   * Подписаться на события роутера
   */
  on(event: string, callback: (...args: any[]) => void): () => void {
    return this.eventEmitter.on(event, callback);
  }

  /**
   * Отписаться от событий роутера
   */
  off(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Проверить инициализацию роутера
   */
  isRouterInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Навигация по URL (публичный метод)
   */
  navigateTo(url: string): void {
    navigate(url);
  }
}
