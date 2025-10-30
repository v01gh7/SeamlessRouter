import { safeNavigateFallback } from "@core/utils";
import { loadPage } from "./loadPage";

export const navigate = async (url: string) => {
    console.log('Навигация к:', url);
    history.pushState({}, '', url);    
    const res = await loadPage(url);
    if (!res) {
    safeNavigateFallback(url);
    return;
    }

}

window.addEventListener('popstate', () => {
    navigate(window.location.pathname);
});