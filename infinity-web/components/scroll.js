export function bindScrollChrome({ shell, threshold = 18, onChange } = {}) {
  const update = () => {
    const scrolled = (window.scrollY || 0) > threshold;
    if (shell) shell.classList.toggle('is-scrolled', scrolled);
    onChange?.(scrolled);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();

  return () => window.removeEventListener('scroll', update);
}
