
const getHrefForRoute = (element: HTMLElement): string | null => {
    if (element.tagName.toLowerCase() === 'a') {
        return element.getAttribute('href');
    } else if (element.tagName.toLowerCase() === 'button') {
        return element.getAttribute('data-router-link');
    }
    return null;
}

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