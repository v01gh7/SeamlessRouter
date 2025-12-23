/**
 * Менеджер для работы с Service Worker
 */

import { getConfig } from "../config";

export class ServiceWorkerManager {
  private isSupported: boolean = false;
  private registration: ServiceWorkerRegistration | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.isEnabled = getConfig().offline.enabled;
  }

  /**
   * Зарегистрировать Service Worker
   */
  async register(): Promise<boolean> {
    if (!this.isSupported || !this.isEnabled) {
      console.warn('⚠️ Service Worker not supported or disabled');
      return false;
    }

    try {
      // Регистрируем Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registered:', this.registration);

      // Слушаем события обновления
      this.setupUpdateListeners();

      // Мониторинг состояния сети
      this.setupNetworkMonitoring();

      return true;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Настроить слушатели обновлений Service Worker
   */
  private setupUpdateListeners(): void {
    if (!this.registration) return;

    // Обновление найдено
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Новый Service Worker готов к активации
              console.log('🔄 New Service Worker available');
              this.showUpdateNotification();
            } else {
              // Первая установка
              console.log('✅ Service Worker installed for the first time');
            }
          }
        });
      }
    });

    // Контроллер изменился
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🎮 Service Worker controller changed');
    });
  }

  /**
   * Показать уведомление об обновлении
   */
  private showUpdateNotification(): void {
    // В реальном приложении здесь можно показать UI уведомление
    console.log('📢 New version available. Refresh to update.');
    
    // Автоматическое обновление при следующей навигации
    if (getConfig().offline.showOfflineIndicator) {
      this.showToast('New version available. Refreshing...');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  /**
   * Настроить мониторинг сети
   */
  private setupNetworkMonitoring(): void {
    if (!getConfig().offline.showOfflineIndicator) return;

    // Проверяем состояние сети
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        this.hideOfflineIndicator();
        console.log('🌐 Online');
      } else {
        this.showOfflineIndicator();
        console.log('📴 Offline');
      }
    };

    // Слушаем изменения состояния сети
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Инициализируем статус
    updateOnlineStatus();
  }

  /**
   * Показать индикатор офлайн-режима
   */
  private showOfflineIndicator(): void {
    // Создаем или находим индикатор
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #f44336;
          color: white;
          text-align: center;
          padding: 10px;
          z-index: 9999;
          font-family: sans-serif;
          font-size: 14px;
        ">
          ⚠️ You are offline. Some features may be unavailable.
        </div>
      `;
      document.body.appendChild(indicator);
    }
    
    indicator.style.display = 'block';
  }

  /**
   * Скрыть индикатор офлайн-режима
   */
  private hideOfflineIndicator(): void {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  /**
   * Показать toast-уведомление
   */
  private showToast(message: string): void {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-family: sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      ">
        ${message}
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /**
   * Обновить Service Worker
   */
  async update(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      console.log('🔄 Service Worker update triggered');
      return true;
    } catch (error) {
      console.error('❌ Service Worker update failed:', error);
      return false;
    }
  }

  /**
   * Отменить регистрацию Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      console.log('🗑️ Service Worker unregistered:', result);
      this.registration = null;
      return result;
    } catch (error) {
      console.error('❌ Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Очистить кэш Service Worker
   */
  async clearCache(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      // Отправляем сообщение Service Worker для очистки кэша
      const sw = this.registration.active;
      if (sw) {
        sw.postMessage({ type: 'CLEAR_CACHE' });
      }

      // Также очищаем через Cache API
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );

      console.log('🧹 Service Worker cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear Service Worker cache:', error);
      return false;
    }
  }

  /**
   * Получить статистику кэша
   */
  async getCacheStats(): Promise<any> {
    if (!this.registration) return null;

    try {
      const sw = this.registration.active;
      if (!sw) return null;

      // Отправляем сообщение и ждем ответ
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.error) {
            reject(event.data.error);
          } else {
            resolve(event.data);
          }
        };

        sw.postMessage({ type: 'GET_CACHE_STATS' }, [messageChannel.port2]);
      });
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Проверить поддержку Service Worker
   */
  isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Проверить, зарегистрирован ли Service Worker
   */
  isRegistered(): boolean {
    return !!this.registration;
  }

  /**
   * Получить регистрацию Service Worker
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Включить/выключить Service Worker
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (!enabled && this.registration) {
      this.unregister();
    } else if (enabled && !this.registration) {
      this.register();
    }
  }
}