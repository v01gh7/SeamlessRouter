

export const attachRoutesListeners = (elements: HTMLElement[], onNavigate: (url: string) => void) => {
    for (const element of elements) {
        element.addEventListener('click', e => {
            const target = e.currentTarget as HTMLElement;
            const href: string | null = target.getAttribute('href');
            if (!href) return;
            e.preventDefault();
            e.stopPropagation();
            onNavigate(href);
        })
    }
}