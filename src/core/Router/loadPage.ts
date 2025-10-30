export const loadPage = async (url: string): Promise<Response | null> => {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      console.warn(`loadPage: HTTP ${res.status} при загрузке ${url}`);
      return null;
    }
    return res;
  } catch (err) {
    console.error('loadPage: ошибка сети или запроса', err);
    return null;
  }
};
