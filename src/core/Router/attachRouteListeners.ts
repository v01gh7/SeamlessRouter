import { ROUTE_SELECTORS } from "@core/utils";

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



export const attachRoutesListeners = (elements: HTMLElement[], onNavigate: (url: string) => void) => {
    for (const element of elements) {
        element.addEventListener('click', e => {
            const target = e.currentTarget as HTMLElement;

            if (target.tagName.toLowerCase() !== 'a' && target.tagName.toLowerCase() !== 'button') return;

            const href: string | null = getHrefForRoute(target);

            if (!href) return;
            
            e.preventDefault();
            e.stopPropagation();
            onNavigate(href);
        })
    }
}

export const attachGlobalRoutesListener = (onNavigate: (url: string) => void) => {
    const handlerMap = new WeakMap<HTMLElement, (e: Event) => void>();

    const handleClick = (e: Event) => {
        const target = e.currentTarget as HTMLElement;
        const href = getHrefForRoute(target);
        if (!href) return;

        e.preventDefault();
        e.stopPropagation();
        onNavigate(href);
    };

    const addListenersToElements = (elements: NodeListOf<Element> | Element[]) => {
        elements.forEach(el => {
            if (el instanceof HTMLElement) {
                const href = getHrefForRoute(el);
                if (href) {
                    el.addEventListener('click', handleClick);
                    handlerMap.set(el, handleClick);
                }
            }
        });
    };

    const removeListenersFromElements = (elements: NodeListOf<Element> | Element[]) => {
        elements.forEach(el => {
            if (el instanceof HTMLElement) {
                const handler = handlerMap.get(el);
                if (handler) {
                    el.removeEventListener('click', handler);
                    handlerMap.delete(el);
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

    // Возвращаем функцию для отключения наблюдателя (опционально)
    return () => {
        observer.disconnect();
        // Удалить все обработчики? Но если мы отключаем роутер, то нужно.
        const allElements = document.querySelectorAll(ROUTE_SELECTORS.join(', '));
        removeListenersFromElements(allElements);
    };
};



