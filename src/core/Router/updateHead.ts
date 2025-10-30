import { appendFreshScript } from "@core/utils/dom";

/**
 * Synchronizes current document head with new head from loaded page.
 * Handles special cases: title replacement, script re-execution, and duplicate prevention.
 */
export const updateHead = (newHead: HTMLHeadElement) => {
    const currentHead = document.head;
    const newHeadElements = Array.from(newHead.children);

    for (const newElem of newHeadElements) {
        const tagName = newElem.tagName.toLowerCase();

        if (tagName === 'title') {
            const oldTitle = currentHead.querySelector('title');
            if (oldTitle) oldTitle.remove();
            currentHead.appendChild(newElem.cloneNode(true));
            continue;
        }
        if (tagName === 'script') {
            appendFreshScript(newElem as HTMLScriptElement, 'head');
            continue;
        }
        

        if (!isElementInHead(newElem, currentHead)) {
            currentHead.appendChild(newElem.cloneNode(true));
        }
    }

    for (const oldElem of currentHead.children) {
        if (!isElementInHead(oldElem, newHead)) {
            oldElem.remove();
        }
    }    

}


/**
 * Checks if an element already exists in <head> by comparing specific attributes:
 * - For <meta>: matches by 'name' or 'property' attribute
 * - For <link>: matches by 'rel' and 'href' attributes  
 * - For other elements: basic tag name comparison only
 * Used to prevent duplicate head elements during navigation.
 */
const isElementInHead = (newElem: Element, head: HTMLHeadElement): boolean => {
    const tagName = newElem.tagName.toLowerCase();

    for (const currentElem of head.children) {
        if (currentElem.tagName.toLowerCase() !== tagName) continue;

        if (tagName === 'meta') {
            const newMeta = newElem as HTMLMetaElement;
            const currentMeta = currentElem as HTMLMetaElement;

            if (
                (newMeta.getAttribute('name') && currentMeta.getAttribute('name') === newMeta.getAttribute('name')) ||
                (newMeta.getAttribute('property') && currentMeta.getAttribute('property') === newMeta.getAttribute('property'))
            ) {
                return true;
            }
        }

        if (tagName === 'link') {
            const newLink = newElem as HTMLLinkElement;
            const currentLink = currentElem as HTMLLinkElement;

            if (
                newLink.getAttribute('rel') === currentLink.getAttribute('rel') &&
                newLink.getAttribute('href') === currentLink.getAttribute('href')
            ) {
                return true;
            }
        }
    }

    return false;

}





