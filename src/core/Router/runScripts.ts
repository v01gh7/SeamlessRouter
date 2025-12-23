import { purgeAllScripts } from "@core/Sandbox/sandbox";
import { appendFreshScript, shouldSkip, shouldPreserve, extractScripts, clearScriptCache } from "@core/utils/dom";

export const runScripts = (newBody: HTMLElement) => {
    purgeAllScripts();
    clearScriptCache(); // Очищаем кэш скриптов после удаления
    const scripts: HTMLScriptElement[] = extractScripts(newBody as HTMLBodyElement);

    for (const script of scripts) {
        if (shouldSkip(script)) continue;
        if (shouldPreserve(script)) continue; 
        appendFreshScript(script as HTMLScriptElement, 'body');
    }
};
