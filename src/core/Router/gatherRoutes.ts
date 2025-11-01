import { ROUTE_SELECTORS } from "@core/utils"



export const gatherRoutes = (): HTMLElement[] => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(ROUTE_SELECTORS.join(',')))
    return elements
}