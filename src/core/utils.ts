
export const hasClass = (el: HTMLElement | Element | null, _className: string="active") => {
	return el?.classList.contains(_className)
}

export const removeClass = (el: HTMLElement | Element | null, _className: string = "active"): boolean => {
    if (el && el.classList.contains(_className)) {
        el.classList.remove(_className);
        return true;
    }
    return false;
}

export const addClass = (el: HTMLElement | Element | null, _className: string = "active"): boolean => {
    if(el && !hasClass(el, _className)){
        el.classList.add(_className)
        return true;
    }
    return false;
}