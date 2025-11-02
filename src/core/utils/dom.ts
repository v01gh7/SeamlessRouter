import { hashCode } from "./hash";

export const parseHTML = (htmlText: string): Document => {
    const parser = new DOMParser();
    return parser.parseFromString(htmlText, 'text/html');
};

const scriptCache = new Set<string>();

const getScriptHash = (elem: HTMLScriptElement): string | null => {
    const src = elem.getAttribute("src");
    if (src) return `src:${src}`;
    const code = elem.textContent?.trim();
    if (code) return `code:${hashCode(code.replace(/\s+/g, " "))}`;
    return null;
};

/**
* Adds a new <script>, automatically removing existing ones with the same src/code.
* Uses cache hashing to prevent duplicates.
*/
export const appendFreshScript = (
    newElem: HTMLScriptElement,
    appendTo: "head" | "body" = "head"
): void => {
    if (!newElem) return;

    const hash = getScriptHash(newElem);
    if (!hash) return;

    const forceReload = shouldReload(newElem);

    // 🧹 Удаляем предыдущие экземпляры того же скрипта
    removeExistingScript(newElem, hash);

    // 🚫 Пропускаем, если уже был выполнен (если нет data-reload)
    if (scriptCache.has(hash) && !forceReload) return;

    // 🧱 Создаём новый <script>
    const script = cloneScript(newElem);

    // 📥 Вставляем
    const target =
        appendTo === "body"
            ? document.body
            : appendTo === "head"
            ? document.head
            : document.head;

    target.appendChild(script);

    // 🧠 Обновляем кэш
    scriptCache.add(hash);
};

export const extractScripts = (newBody: HTMLBodyElement): HTMLScriptElement[] => {
    const scripts = Array.from(newBody.querySelectorAll('script'));
    const response: HTMLScriptElement[] = [];
    for (const script of scripts) {
        const clonedScript = cloneScript(script as HTMLScriptElement);
        response.push(clonedScript);
        newBody.removeChild(script);
    }
    return response;
};

const removeExistingScript = (elem: HTMLScriptElement, hash: string): void => {
    if (hash.startsWith("src:")) {
        const src = elem.getAttribute("src");
        if (!src) return;
        document.querySelectorAll<HTMLScriptElement>(`script[src="${src}"]`)
            .forEach(el => el.remove());
    } else if (hash.startsWith("code:")) {
        const normalizedCode = elem.textContent?.trim()?.replace(/\s+/g, " ");
        if (!normalizedCode) return;
        document.querySelectorAll<HTMLScriptElement>("script:not([src])")
            .forEach(el => {
                const text = el.textContent?.trim()?.replace(/\s+/g, " ");
                if (text === normalizedCode) el.remove();
            });
    }
};

const cloneScript = (elem: HTMLScriptElement): HTMLScriptElement => {
    const clone = document.createElement("script");
    for (const attr of elem.getAttributeNames()) {
        const val = elem.getAttribute(attr);
        if (val !== null) clone.setAttribute(attr, val);
    }

    if (!elem.src) {
        const code = elem.textContent?.trim();
        if (code) clone.textContent = code;
    }

    return clone;
};

export const shouldPreserve = (elem: Element): boolean => 
    elem.hasAttribute('data-keep');

export const shouldSkip = (elem: Element): boolean => 
    elem.hasAttribute('data-skip');

export const shouldReload = (elem: Element): boolean => 
    elem.hasAttribute('data-reload');


