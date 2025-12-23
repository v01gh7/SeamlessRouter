/**
 * Улучшенная навигация с поддержкой анимаций
 */

import { safeNavigateFallback } from "@core/utils";
import { loadPage } from "./loadPage";
import { parseHTML } from "@core/utils/dom";
import { updateHead } from "./updateHead";
import { runScripts } from "./runScripts";
import { getConfig, type AnimationType } from "../config";

// Глобальная ссылка на AnimationManager
let animationManager: any = null;

/**
 * Установить AnimationManager
 */
export function setAnimationManager(manager: any): void {
  animationManager = manager;
}

/**
 * Обновить body с анимацией
 */
async function updateBodyWithAnimation(
  newBody: HTMLBodyElement, 
  animationType?: AnimationType
): Promise<void> {
  const oldBody = document.body;
  const container = document.body.parentElement!;
  
  // Клонируем новый body
  const newBodyClone = newBody.cloneNode(true) as HTMLElement;
  
  // Если есть AnimationManager и анимации включены
  if (animationManager && getConfig().animations.enabled) {
    await animationManager.animatePageTransition(
      oldBody,
      newBodyClone,
      container,
      {
        type: animationType || 'fade',
        duration: getConfig().animations.defaultDuration,
        onComplete: () => {
          // После анимации обновляем head и запускаем скрипты
          updateHeadFromBody(newBody);
          runScripts(newBodyClone);
        },
      }
    );
  } else {
    // Без анимации - просто заменяем
    container.replaceChild(newBodyClone, oldBody);
    updateHeadFromBody(newBody);
    runScripts(newBodyClone);
  }
}

/**
 * Обновить head из нового body
 */
function updateHeadFromBody(newBody: HTMLBodyElement): void {
  // Находим head в исходном документе
  const doc = newBody.ownerDocument;
  if (doc && doc.head) {
    updateHead(doc.head);
  }
}

/**
 * Улучшенная навигация с анимациями
 */
export const navigateEnhanced = async (
  url: string, 
  animationType?: AnimationType
) => {
  console.log('🎬 Навигация с анимацией к:', url, animationType ? `(type: ${animationType})` : '');
  
  // Обновляем историю
  history.pushState({}, '', url);
  
  // Загружаем страницу
  const res = await loadPage(url);
  if (!res) {
    safeNavigateFallback(url);
    return;
  }

  const text = await res.text();
  const doc = parseHTML(text);

  // Обновляем body с анимацией
  await updateBodyWithAnimation(doc.body as HTMLBodyElement, animationType);
}

/**
 * Навигация с кастомными параметрами анимации
 */
export const navigateWithAnimation = async (
  url: string,
  options: {
    type?: string;
    duration?: number;
    direction?: 'forward' | 'backward';
  } = {}
) => {
  const config = getConfig();
  
  // Определяем тип анимации
  let animationType: AnimationType | undefined = options.type as AnimationType;
  
  if (!animationType) {
    // Автоматический выбор анимации на основе направления
    if (options.direction === 'backward') {
      // Для навигации назад используем обратную анимацию
      animationType = config.animations.animationTypes.includes('slide-right') 
        ? 'slide-right'
        : 'fade';
    } else {
      // Для навигации вперед используем стандартную анимацию
      animationType = config.animations.animationTypes.includes('slide-left') 
        ? 'slide-left'
        : 'fade';
    }
  }
  
  return navigateEnhanced(url, animationType);
}

// Обработка popstate с учетом направления
let lastPopStateTime = 0;
let isPopStateHandled = false;

window.addEventListener('popstate', (event) => {
  const currentTime = Date.now();
  const timeSinceLastPopState = currentTime - lastPopStateTime;
  
  // Защита от двойного срабатывания
  if (timeSinceLastPopState < 100 || isPopStateHandled) {
    return;
  }
  
  lastPopStateTime = currentTime;
  isPopStateHandled = true;
  
  // Определяем направление на основе event.state или истории
  const direction = event.state?.direction || 
    (history.length > 1 ? 'backward' : 'forward');
  
  navigateWithAnimation(window.location.pathname, {
    direction: direction as 'forward' | 'backward'
  });
  
  // Сбрасываем флаг через небольшой таймаут
  setTimeout(() => {
    isPopStateHandled = false;
  }, 100);
});

/**
 * Программная навигация с анимацией
 */
export function programmaticNavigate(
  url: string, 
  animationType?: AnimationType
): void {
  if (animationManager && getConfig().animations.enabled) {
    navigateEnhanced(url, animationType);
  } else {
    // Без анимации
    navigateEnhanced(url);
  }
}

/**
 * Получить доступные типы анимаций
 */
export function getAvailableAnimationTypes(): string[] {
  return getConfig().animations.animationTypes;
}

/**
 * Проверить, включены ли анимации
 */
export function areAnimationsEnabled(): boolean {
  return getConfig().animations.enabled;
}

/**
 * Установить тип анимации по умолчанию
 */
export function setDefaultAnimationType(type: AnimationType): void {
  // Обновляем конфигурацию
  const config = getConfig();
  if (config.animations.animationTypes.includes(type)) {
    // Здесь можно обновить конфигурацию
    console.log(`🎬 Default animation type set to: ${type}`);
  }
}