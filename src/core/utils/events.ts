/**
 * Простой EventEmitter для управления событиями роутера
 */

type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Подписаться на событие
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const callbacks = this.events.get(event)!;
    callbacks.push(callback);

    // Возвращаем функцию для отписки
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Отписаться от события
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    // Если больше нет обработчиков, удаляем событие
    if (callbacks.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Вызвать событие
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    // Вызываем все обработчики
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }

  /**
   * Подписаться на событие один раз
   */
  once(event: string, callback: EventCallback): () => void {
    const onceCallback: EventCallback = (...args) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    
    return this.on(event, onceCallback);
  }

  /**
   * Проверить, есть ли обработчики для события
   */
  hasListeners(event: string): boolean {
    return this.events.has(event) && this.events.get(event)!.length > 0;
  }

  /**
   * Удалить все обработчики события
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Получить список всех событий
   */
  getEventNames(): string[] {
    return Array.from(this.events.keys());
  }
}