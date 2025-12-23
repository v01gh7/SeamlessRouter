/**
 * Менеджер анимаций для переходов между страницами
 */

import { getConfig, type AnimationType } from "../config";

export interface AnimationOptions {
  type?: AnimationType;
  duration?: number;
  easing?: string;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export class AnimationManager {
  private isAnimating: boolean = false;
  private currentAnimation: Animation | null = null;
  private prefersReducedMotion: boolean = false;

  constructor() {
    this.checkReducedMotion();
    
    // Слушаем изменения предпочтений
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
      
      mediaQuery.addEventListener('change', (event) => {
        this.prefersReducedMotion = event.matches;
      });
    }
  }

  /**
   * Проверить предпочтения пользователя по анимациям
   */
  private checkReducedMotion(): void {
    if (window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /**
   * Проверить, должны ли мы показывать анимации
   */
  private shouldAnimate(options: AnimationOptions): boolean {
    const config = getConfig();
    
    if (!config.animations.enabled) return false;
    if (config.animations.respectReducedMotion && this.prefersReducedMotion) return false;
    
    return true;
  }

  /**
   * Анимировать переход между страницами
   */
  async animatePageTransition(
    oldContent: HTMLElement,
    newContent: HTMLElement,
    container: HTMLElement,
    options: AnimationOptions = {}
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
    const animationType = options.type || 'fade';
    const duration = options.duration || config.animations.defaultDuration;
    const easing = options.easing || 'ease-in-out';

    try {
      await this.executeAnimation(
        oldContent,
        newContent,
        container,
        animationType,
        duration,
        easing,
        options
      );
    } catch (error) {
      console.error('Animation error:', error);
      // Fallback - просто заменяем контент
      container.replaceChild(newContent, oldContent);
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Выполнить анимацию
   */
  private async executeAnimation(
    oldContent: HTMLElement,
    newContent: HTMLElement,
    container: HTMLElement,
    type: AnimationType,
    duration: number,
    easing: string,
    options: AnimationOptions
  ): Promise<void> {
    // Подготавливаем элементы для анимации
    this.prepareElements(oldContent, newContent, type);

    // Вставляем новый контент (скрытый)
    container.appendChild(newContent);

    // Создаем и запускаем анимацию
    const keyframes = this.getKeyframes(type, oldContent, newContent);
    const animation = oldContent.animate(keyframes, {
      duration,
      easing,
      fill: 'forwards',
    });

    this.currentAnimation = animation;

    // Анимируем новый контент
    const newContentKeyframes = this.getNewContentKeyframes(type);
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
    this.finishTransition(oldContent, newContent, container);
    options.onComplete?.();

    // Очищаем ссылки
    this.currentAnimation = null;
  }

  /**
   * Подготовить элементы для анимации
   */
  private prepareElements(oldContent: HTMLElement, newContent: HTMLElement, type: AnimationType): void {
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
  }

  /**
   * Получить keyframes для анимации
   */
  private getKeyframes(
    type: AnimationType,
    oldContent: HTMLElement,
    newContent: HTMLElement
  ): Keyframe[] {
    switch (type) {
      case 'fade':
        return [
          { opacity: 1, visibility: 'visible' },
          { opacity: 0, visibility: 'hidden' },
        ];

      case 'slide-left':
        return [
          { transform: 'translateX(0)', opacity: 1, visibility: 'visible' },
          { transform: 'translateX(-100%)', opacity: 0, visibility: 'hidden' },
        ];

      case 'slide-right':
        return [
          { transform: 'translateX(0)', opacity: 1, visibility: 'visible' },
          { transform: 'translateX(100%)', opacity: 0, visibility: 'hidden' },
        ];

      case 'slide-up':
        return [
          { transform: 'translateY(0)', opacity: 1, visibility: 'visible' },
          { transform: 'translateY(-100%)', opacity: 0, visibility: 'hidden' },
        ];

      case 'slide-down':
        return [
          { transform: 'translateY(0)', opacity: 1, visibility: 'visible' },
          { transform: 'translateY(100%)', opacity: 0, visibility: 'hidden' },
        ];

      case 'collapse':
        return [
          { transform: 'scale(1)', opacity: 1, visibility: 'visible' },
          { transform: 'scale(0.8)', opacity: 0, visibility: 'hidden' },
        ];

      case 'diagonal':
        return [
          { transform: 'translate(0, 0) scale(1)', opacity: 1, visibility: 'visible' },
          { transform: 'translate(100%, 100%) scale(0.8)', opacity: 0, visibility: 'hidden' },
        ];

      default:
        return [
          { opacity: 1, visibility: 'visible' },
          { opacity: 0, visibility: 'hidden' },
        ];
    }
  }

  /**
   * Получить keyframes для нового контента
   */
  private getNewContentKeyframes(type: AnimationType): Keyframe[] {
    switch (type) {
      case 'fade':
        return [
          { opacity: 0, visibility: 'hidden' },
          { opacity: 1, visibility: 'visible' },
        ];

      case 'slide-left':
        return [
          { transform: 'translateX(100%)', opacity: 0, visibility: 'hidden' },
          { transform: 'translateX(0)', opacity: 1, visibility: 'visible' },
        ];

      case 'slide-right':
        return [
          { transform: 'translateX(-100%)', opacity: 0, visibility: 'hidden' },
          { transform: 'translateX(0)', opacity: 1, visibility: 'visible' },
        ];

      case 'slide-up':
        return [
          { transform: 'translateY(100%)', opacity: 0, visibility: 'hidden' },
          { transform: 'translateY(0)', opacity: 1, visibility: 'visible' },
        ];

      case 'slide-down':
        return [
          { transform: 'translateY(-100%)', opacity: 0, visibility: 'hidden' },
          { transform: 'translateY(0)', opacity: 1, visibility: 'visible' },
        ];

      case 'collapse':
        return [
          { transform: 'scale(1.2)', opacity: 0, visibility: 'hidden' },
          { transform: 'scale(1)', opacity: 1, visibility: 'visible' },
        ];

      case 'diagonal':
        return [
          { transform: 'translate(-100%, -100%) scale(1.2)', opacity: 0, visibility: 'hidden' },
          { transform: 'translate(0, 0) scale(1)', opacity: 1, visibility: 'visible' },
        ];

      default:
        return [
          { opacity: 0, visibility: 'hidden' },
          { opacity: 1, visibility: 'visible' },
        ];
    }
  }

  /**
   * Завершить переход
   */
  private finishTransition(
    oldContent: HTMLElement,
    newContent: HTMLElement,
    container: HTMLElement
  ): void {
    // Удаляем старый контент
    container.removeChild(oldContent);

    // Сбрасываем стили нового контента
    newContent.style.cssText = '';
    newContent.classList.remove('router-animation-new', 'router-animation-old');
    
    // Удаляем классы анимации
    const animationClasses = Array.from(newContent.classList)
      .filter(className => className.startsWith('router-animation-'));
    animationClasses.forEach(className => newContent.classList.remove(className));
  }

  /**
   * Отменить текущую анимацию
   */
  async cancelCurrentAnimation(): Promise<void> {
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
      this.currentAnimation = null;
    }
    this.isAnimating = false;
  }

  /**
   * Проверить, выполняется ли анимация
   */
  isAnimationInProgress(): boolean {
    return this.isAnimating;
  }

  /**
   * Получить доступные типы анимаций
   */
  getAvailableAnimationTypes(): AnimationType[] {
    return getConfig().animations.animationTypes;
  }

  /**
   * Создать CSS для анимаций
   */
  static createAnimationStyles(): string {
    return `
      /* Базовые стили будут загружены из animations.css */
      .router-animation-old,
      .router-animation-new {
        will-change: transform, opacity;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }

      @media (prefers-reduced-motion: reduce) {
        .router-animation-old,
        .router-animation-new {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
  }

  /**
   * Загрузить CSS анимации
   */
  static loadAnimationStyles(): void {
    // Проверяем, не загружены ли стили уже
    if (document.head.querySelector('link[href*="animations.css"]')) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/animations.css';
    link.onload = () => console.log('✅ Animation styles loaded');
    link.onerror = () => console.warn('⚠️ Failed to load animation styles');
    
    document.head.appendChild(link);
  }
}