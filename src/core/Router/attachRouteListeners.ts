
const getHrefForRoute = (element: HTMLElement): string | null => {
    let response: string | null = null;

    if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('href')) {
        const anchor = element as HTMLAnchorElement;
        if (anchor.target === '_blank') return null;
        response = anchor.getAttribute('href');
    } else if (element.tagName.toLowerCase() === 'button' && element.hasAttribute('data-router-link')) {
        response = element.getAttribute('data-router-link');
    }

    if (response && !response.startsWith(document.location.origin)) {
        response = null;
    }

    return response;
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