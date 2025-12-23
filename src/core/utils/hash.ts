/**
 * Быстрая хэш-функция для строк (DJB2)
 * Возвращает короткий числовой хэш (string)
 */
export const hashCode = (str: string): string => {
    let hash = 5381;
    let i = str.length;
    while (i) hash = (hash * 33) ^ str.charCodeAt(--i);
    return (hash >>> 0).toString(36); // преобразуем в base36 для компактности
};

/**
 * Хэш для HTML контента (учитывает только body и скрипты)
 */
export const hashHtmlContent = (html: string): string => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Извлекаем body контент
        const bodyContent = doc.body.innerHTML.trim();
        
        // Извлекаем скрипты
        const scripts = Array.from(doc.querySelectorAll('script'))
            .map(script => {
                if (script.src) {
                    return `src:${script.src}`;
                }
                return script.textContent?.trim() || '';
            })
            .join('|');
        
        // Создаем строку для хэширования
        const contentToHash = `${bodyContent}|${scripts}`;
        
        return hashCode(contentToHash);
    } catch (error) {
        // Если парсинг не удался, хэшируем всю строку
        console.warn('Failed to parse HTML for hashing, using full string:', error);
        return hashCode(html);
    }
};

/**
 * Хэш для заголовков ответа
 */
export const hashHeaders = (headers: Record<string, string>): string => {
    const relevantHeaders = {
        'last-modified': headers['last-modified'],
        'etag': headers['etag'],
        'content-type': headers['content-type'],
    };
    
    return hashCode(JSON.stringify(relevantHeaders));
};

/**
 * Комбинированный хэш для кэширования
 */
export const getCacheHash = (
    url: string, 
    html: string, 
    headers: Record<string, string>
): string => {
    const urlHash = hashCode(url);
    const contentHash = hashHtmlContent(html);
    const headersHash = hashHeaders(headers);
    
    return `${urlHash}:${contentHash}:${headersHash}`;
};
