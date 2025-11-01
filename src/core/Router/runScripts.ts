import { appendFreshScript } from "@core/utils/dom";

export const runScripts = (newBody: HTMLElement) => {
    for (const script of newBody.querySelectorAll('script:not([data-skip])')) {
        appendFreshScript(script as HTMLScriptElement);
    }
};
