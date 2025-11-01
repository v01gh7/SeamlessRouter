export const updateBody = (newBody: HTMLElement) => {
  const currentBody = document.body;
  const preserved = document.getElementById('avoid');
  
  currentBody.innerHTML = newBody.innerHTML;
  if (preserved) currentBody.prepend(preserved);
};