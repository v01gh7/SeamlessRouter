export const parseHTML = (htmlText: string): Document => {
    const parser = new DOMParser();
    return parser.parseFromString(htmlText, 'text/html');
};

export const appendFreshScript = (newElem: HTMLScriptElement, appendTo: string = 'head'): void => {
    if (!newElem) return;
    const src = newElem.getAttribute('src');
    if (src && document.querySelector(`script[src="${src}"]`)) return;

    const script = document.createElement('script');

    for (const attr of newElem.getAttributeNames()) {
        const val = newElem.getAttribute(attr);
        if (val !== null) script.setAttribute(attr, val);
    }

    if (!src) {
        const code = newElem.textContent?.trim();
        if (code) script.textContent = code;
    }

    if (appendTo === 'head') {
        document.head.appendChild(script);
    } else if (appendTo === 'body') {
        document.body.appendChild(script);
    } else {
        console.warn(`appendFreshScript: Unknown appendTo value "${appendTo}", defaulting to head.`);
    }
    return;
};
