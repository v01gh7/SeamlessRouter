import { safeNavigateFallback } from "@core/utils";
import { loadPage } from "./loadPage";
import { parseHTML } from "@core/utils/dom";
import { updateHead } from "./updateHead";
import { updateBody } from "./updateBody";

export const navigate = async (url: string) => {
    console.log('Навигация к:', url);
    history.pushState({}, '', url);    
    const res = await loadPage(url);
    if (!res) {
    safeNavigateFallback(url);
    return;
    }

    const text = await res.text();
    const doc = parseHTML(text);

    updateHead(doc.head);
    updateBody(doc.body);
}

window.addEventListener('popstate', () => {
    navigate(window.location.pathname);
});