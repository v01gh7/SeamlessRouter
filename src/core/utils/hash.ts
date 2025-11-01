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
