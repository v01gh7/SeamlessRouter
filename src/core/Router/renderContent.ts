
import { appendFreshScript } from "@core/utils/dom";


export const renderContent = (newBody: HTMLElement) => {
    updateBody(newBody);
};

/**
 * Renders new body content by replacing current document body with new body from loaded page.
 * Preserves specific elements (e.g., global loaders) and ensures scripts are executed.
 * @param newBody - The new body element from the loaded page.
 */
const updateBody = (newBody: HTMLElement) => {
  const currentBody = document.body;
  const preserved = document.getElementById('avoid'); // пример
  
  currentBody.innerHTML = newBody.innerHTML;
  if (preserved) currentBody.prepend(preserved);

  for (const script of newBody.querySelectorAll('script')) {
    appendFreshScript(script);
  }
};