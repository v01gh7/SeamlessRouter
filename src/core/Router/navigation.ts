export const navigate = (url: string) => {
    console.log('Навигация к:', url);
    history.pushState({}, '', url);    
}

window.addEventListener('popstate', () => {
    navigate(window.location.pathname);
});