export const navigate = (url: string) => {
    console.log('Навигация к:', url);
    history.pushState({}, '', url);    
}