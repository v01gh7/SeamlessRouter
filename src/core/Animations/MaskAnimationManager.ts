/**
 * Менеджер анимаций с использованием CSS mask-image
 */

import { AnimationManager, type AnimationOptions } from './AnimationManager';
import { getConfig, type AnimationType } from '../config';

export class MaskAnimationManager extends AnimationManager {
  private maskSupported: boolean = false;

  constructor() {
    super();
    this.checkMaskSupport();
  }

  /**
   * Проверить поддержку CSS mask-image
   */
  private checkMaskSupport(): void {
    // Проверяем поддержку mask-image
    const element = document.createElement('div');
    this.maskSupported = 'maskImage' in element.style || 
                        'webkitMaskImage' in element.style || 
                        'mozMaskImage' in element.style;
    
    if (!this.maskSupported) {
      console.warn('⚠️ CSS mask-image не поддерживается в этом браузере. Будут использоваться стандартные анимации.');
    }
  }

  /**
   * Проверить, должны ли мы показывать анимации с масками
   */
  private shouldUseMaskAnimation(options: AnimationOptions): boolean {
    if (!this.maskSupported) {
      return false;
    }

    const config = getConfig();
    const animationType = options.type || config.animations.defaultType || 'fade';
    
    // Проверяем, является ли тип анимации масковой
    return animationType === 'mask-circle' || animationType === 'mask-gradient';
  }

  /**
   * Анимировать переход между страницами с поддержкой масок
   */
  async animatePageTransition(
    oldContent: HTMLElement,
    newContent: HTMLElement,
    container: HTMLElement,
    options: AnimationOptions = {}
  ): Promise<void> {
    // Если это масковая анимация и она поддерживается
    if (this.shouldUseMaskAnimation(options)) {
      return this.executeMaskAnimation(oldContent, newContent, container, options);
    }
    
    // Иначе используем стандартную анимацию
    return super.animatePageTransition(oldContent, newContent, container, options);
  }

  /**
   * Выполнить масковую анимацию
   */
  private async executeMaskAnimation(
    oldContent: HTMLElement,
    newContent: HTMLElement,
    container: HTMLElement,
    options: AnimationOptions
  ): Promise<void> {
    if (!this.shouldAnimate(options)) {
      // Без анимации - просто заменяем контент
      container.replaceChild(newContent, oldContent);
      options.onComplete?.();
      return;
    }

    if (this.isAnimating) {
      await this.cancelCurrentAnimation();
    }

    this.isAnimating = true;
    options.onStart?.();

    const config = getConfig();
    const animationType = options.type || 'mask-circle';
    const duration = options.duration || config.animations.defaultDuration;
    const easing = options.easing || 'ease-in-out';

    try {
      await this.executeMaskAnimationInternal(
        oldContent,
        newContent,
        container,
        animationType as 'mask-circle' | 'mask-gradient',
        duration,
        easing,
        options
      );
    } catch (error) {
      console.error('Mask animation error:', error);
      // Fallback - используем стандартную анимацию
      await super.animatePageTransition(oldContent, newContent, container, {
        ...options,
        type: 'fade'
      });
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Внутренняя реализация масковой анимации
   */
  private async executeMaskAnimationInternal(
    oldContent: HTMLElement,
    newContent: HTMLElement,
    container: HTMLElement,
    type: 'mask-circle' | 'mask-gradient',
    duration: number,
    easing: string,
    options: AnimationOptions
  ): Promise<void> {
    // Подготавливаем элементы для масковой анимации
    this.prepareElementsForMask(oldContent, newContent, type);

    // Вставляем новый контент (скрытый)
    container.appendChild(newContent);

    // Создаем и запускаем анимацию маски
    const keyframes = this.getMaskKeyframes(type);
    const animation = oldContent.animate(keyframes, {
      duration,
      easing,
      fill: 'forwards',
    });

    this.currentAnimation = animation;

    // Анимируем новый контент
    const newContentKeyframes = this.getNewContentMaskKeyframes(type);
    const newContentAnimation = newContent.animate(newContentKeyframes, {
      duration,
      easing,
      fill: 'forwards',
    });

    // Ждем завершения анимаций
    await Promise.all([
      animation.finished,
      newContentAnimation.finished,
    ]);

    // Завершаем переход
    this.finishMaskTransition(oldContent, newContent, container);
    options.onComplete?.();

    // Очищаем ссылки
    this.currentAnimation = null;
  }

  /**
   * Подготовить элементы для масковой анимации
   */
  private prepareElementsForMask(
    oldContent: HTMLElement,
    newContent: HTMLElement,
    type: 'mask-circle' | 'mask-gradient'
  ): void {
    // Устанавливаем базовые стили
    const baseStyles: Partial<CSSStyleDeclaration> = {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    };

    Object.assign(oldContent.style, baseStyles);
    Object.assign(newContent.style, {
      ...baseStyles,
      opacity: '0',
      visibility: 'hidden',
    });

    // Добавляем классы для анимации
    oldContent.classList.add('router-animation-old');
    newContent.classList.add('router-animation-new');
    oldContent.classList.add(`router-animation-${type}`);
    newContent.classList.add(`router-animation-${type}`);

    // Добавляем классы для масок
    oldContent.classList.add('router-mask-animation');
    newContent.classList.add('router-mask-animation');
  }

  /**
   * Получить keyframes для масковой анимации
   */
  private getMaskKeyframes(type: 'mask-circle' | 'mask-gradient'): Keyframe[] {
    switch (type) {
      case 'mask-circle':
        return [
          { 
            maskImage: 'radial-gradient(circle at center, black 0%, black 100%)',
            webkitMaskImage: 'radial-gradient(circle at center, black 0%, black 100%)',
            opacity: 1,
            visibility: 'visible'
          },
          { 
            maskImage: 'radial-gradient(circle at center, black 0%, transparent 100%)',
            webkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 100%)',
            opacity: 0,
            visibility: 'hidden'
          },
        ];

      case 'mask-gradient':
        return [
          { 
            maskImage: 'linear-gradient(to right, black 0%, black 100%)',
            webkitMaskImage: 'linear-gradient(to right, black 0%, black 100%)',
            opacity: 1,
            visibility: 'visible'
          },
          { 
            maskImage: 'linear-gradient(to right, transparent 0%, transparent 100%)',
            webkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 100%)',
            opacity: 0,
            visibility: 'hidden'
          },
        ];

      default:
        return [
          { opacity: 1, visibility: 'visible' },
          { opacity: 0, visibility: 'hidden' },
        ];
    }
  }

  /**
   * Получить keyframes для нового контента с маской
   */
  private getNewContentMaskKeyframes(type: 'mask-circle' | 'mask-gradient'): Keyframe[] {
    switch (type) {
      case 'mask-circle':
        return [
          { 
            maskImage: 'radial-gradient(circle at center, transparent 0%, transparent 100%)',
            webkitMaskImage: 'radial-gradient(circle at center, transparent 0%, transparent 100%)',
            opacity: 0,
            visibility: 'hidden'
          },
          { 
            maskImage: 'radial-gradient(circle at center, black 0%, black 100%)',
            webkitMaskImage: 'radial-gradient(circle at center, black 0%, black 100%)',
            opacity: 1,
            visibility: 'visible'
          },
        ];

      case 'mask-gradient':
        return [
          { 
            maskImage: 'linear-gradient(to right, transparent 0%, transparent 100%)',
            webkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 100%)',
            opacity: 0,
            visibility: 'hidden'
          },
          { 
            maskImage: 'linear-gradient(to right, black 0%, black 100%)',
            webkitMaskImage: 'linear-gradient(to right, black 0%, black 100%)',
            opacity: 1,
            visibility: 'visible'
          },
        ];

      default:
        return [
          { opacity: 0, visibility: 'hidden' },
          { opacity: 1, visibility: 'visible' },
        ];
    }
  }

  /**
   * Завершить масковый переход
   */
  private finishMaskTransition(
    oldContent: HTMLElement,
    newContent: HTMLElement,
    container: HTMLElement
  ): void {
    // Удаляем старый контент
    container.removeChild(oldContent);

    // Сбрасываем стили нового контента
    newContent.style.cssText = '';
    newContent.classList.remove('router-animation-new', 'router-animation-old', 'router-mask-animation');
    
    // Удаляем классы анимации
    const animationClasses = Array.from(newContent.classList)
      .filter(className => className.startsWith('router-animation-'));
    animationClasses.forEach(className => newContent.classList.remove(className));

    // Очищаем маски
    newContent.style.maskImage = '';
    newContent.style.webkitMaskImage = '';
  }

  /**
   * Проверить поддержку масок
   */
  isMaskSupported(): boolean {
    return this.maskSupported;
  }

  /**
   * Создать CSS для масковых анимаций
   */
  static createMaskAnimationStyles(): string {
    return `
      /* Стили для масковых анимаций */
      .router-mask-animation {
        mask-size: 100% 100%;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-size: 100% 100%;
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
      }

      /* Классы для ручного управления масковыми анимациями */
      .router-animate-mask-circle {
        animation: router-mask-circle-in 0.5s ease-in-out;
      }

      .router-animate-mask-gradient {
        animation: router-mask-gradient-in 0.5s ease-in-out;
      }

      /* Поддержка prefers-reduced-motion */
      @media (prefers-reduced-motion: reduce) {
        .router-animate-mask-circle,
        .router-animate-mask-gradient {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    `;
  }
}