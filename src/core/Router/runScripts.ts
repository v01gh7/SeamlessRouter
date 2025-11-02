import { appendFreshScript, shouldSkip, shouldPreserve, extractScripts } from "@core/utils/dom";

export const runScripts = (newBody: HTMLElement) => {
    const scripts: HTMLScriptElement[] = extractScripts(newBody as HTMLBodyElement);

    for (const script of scripts) {
        if (shouldSkip(script)) continue;
        if (shouldPreserve(script)) continue; 
        appendFreshScript(script as HTMLScriptElement, 'body');
    }
};
