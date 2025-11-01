import { appendFreshScript, shouldSkip, shouldPreserve } from "@core/utils/dom";

export const runScripts = (newBody: HTMLElement) => {
    const scripts = newBody.querySelectorAll('script');

    for (const script of scripts) {
        if (shouldSkip(script)) continue;
        if (shouldPreserve(script)) continue; 
        appendFreshScript(script as HTMLScriptElement);
    }
};
