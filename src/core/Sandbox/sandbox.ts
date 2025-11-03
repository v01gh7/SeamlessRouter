import { appendFreshScript, shouldPreserve } from "@core/utils/dom";

// sandbox.ts
type CleanupRecord = {
    timeouts: number[];
    intervals: number[];
    listeners: Array<{ target: EventTarget; type: string; handler: any; options?: any }>;
};

const sandboxMap = new WeakMap<HTMLScriptElement, CleanupRecord>();

const globalRecord: CleanupRecord = { timeouts: [], intervals: [], listeners: [] };
const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
const originalSetTimeout = window.setTimeout;
const originalSetInterval = window.setInterval;


// === 1️⃣ Базовая глобальная песочница ===
export const initGlobalSandbox = () => {
    (window as any).setTimeout = function (fn: Function, t?: number, ...args: any[]) {
        const id = originalSetTimeout(fn, t, ...args);
        globalRecord.timeouts.push(id);
        return id;
    };

    (window as any).setInterval = function (fn: Function, t?: number, ...args: any[]) {
        const id = originalSetInterval(fn, t, ...args);
        globalRecord.intervals.push(id);
        return id;
    };

    EventTarget.prototype.addEventListener = function (type: string, handler: any, options?: any) {
        globalRecord.listeners.push({ target: this, type, handler, options });
        originalAddEventListener.call(this, type, handler, options);
    };

    EventTarget.prototype.removeEventListener = function (type: string, handler: any, options?: any) {
        globalRecord.listeners = globalRecord.listeners.filter(
            l => !(l.target === this && l.type === type && l.handler === handler)
        );
        originalRemoveEventListener.call(this, type, handler, options);
    };

    // === 2️⃣ Перехват добавления новых <script> ===
    const origAppend = Element.prototype.appendChild;
    const origPrepend = Element.prototype.prepend;
    const origInsertBefore = Element.prototype.insertBefore;
    const origReplaceChild = Element.prototype.replaceChild;

    Element.prototype.appendChild = function (child: any) {
        if (child instanceof HTMLScriptElement) setupSandbox(child);
        return origAppend.call(this, child);
    };

    Element.prototype.prepend = function (...children: any[]) {
        for (const child of children) {
            if (child instanceof HTMLScriptElement) setupSandbox(child);
        }
        return origPrepend.apply(this, children);
    };

    Element.prototype.insertBefore = function (newNode: any, referenceNode: any) {
        if (newNode instanceof HTMLScriptElement) setupSandbox(newNode);
        return origInsertBefore.call(this, newNode, referenceNode);
    };

    Element.prototype.replaceChild = function (newChild: any, oldChild: any) {
        if (newChild instanceof HTMLScriptElement) setupSandbox(newChild);
        return origReplaceChild.call(this, newChild, oldChild);
    };


    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof HTMLScriptElement) {
                    observer.disconnect(); // предотвратить повторное срабатывание
                    appendFreshScript(node);
                }
            }
        }
    });

    observer.observe(document, { childList: true, subtree: true });


    console.log('🧩 Sandbox initialized');
};

// === 3️⃣ Привязка каждого <script> ===
export const setupSandbox = (script: HTMLScriptElement) => {
    const record: CleanupRecord = { timeouts: [], intervals: [], listeners: [] };
    sandboxMap.set(script, record);
};

// === 4️⃣ Очистка ===
export const cleanupSandbox = (script: HTMLScriptElement) => {
    const record = sandboxMap.get(script);
    if (!record) return;

    record.timeouts.forEach(clearTimeout);
    record.intervals.forEach(clearInterval);
    record.listeners.forEach(({ target, type, handler, options }) => {
        target.removeEventListener(type, handler, options);
    });

    sandboxMap.delete(script);
    console.log(`🧹 Cleaned up script:`, script);
};

// === 5️⃣ Очистка всех, кроме data-keep ===
export const purgeAllScripts = () => {

    document.querySelectorAll('script').forEach(script => {
        if(shouldPreserve(script)) return;
        cleanupSandbox(script as HTMLScriptElement);
        script.remove();
    });

    globalRecord.timeouts.forEach(clearTimeout);
    globalRecord.intervals.forEach(clearInterval);
    globalRecord.listeners.forEach(({ target, type, handler, options }) => {
        if(!target) return;
        target.removeEventListener(type, handler, options);
    });

    console.log('✅ Purged all dynamic scripts and listeners');
};
