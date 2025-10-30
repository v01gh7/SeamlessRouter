
const routesSelectors: string[] = [
    'a',
    'button[data-router-link]'
];

export const gatherRoutes = (): HTMLElement[] => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(routesSelectors.join(',')))
    return elements
}