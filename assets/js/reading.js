// Static reading is useful without JavaScript; enhancement preserves opaque interactive state.
export function interactiveReadingLink(href, search) {
  if (!/^(?:\.\.\/)+#\/t\/[a-z][a-z0-9]{1,7}-\d{1,2}(?:\.\d{1,3}){1,2}[a-z]?$/.test(href)) throw new Error('Invalid interactive reading link');
  if (search && !search.startsWith('?')) throw new Error('Invalid opaque query');
  return href + search;
}
if (typeof document !== 'undefined') {
  for (const link of document.querySelectorAll('[data-interactive]')) link.setAttribute('href', interactiveReadingLink(link.getAttribute('href'), location.search));
  const alias = document.querySelector('[data-reading-alias]');
  if (alias) {
    const target = alias.getAttribute('href');
    if (/^\.\.\/[a-z][a-z0-9]{1,7}-\d{1,2}(?:\.\d{1,3}){1,2}[a-z]?\/$/.test(target)) location.replace(target + location.search + location.hash);
  }
  const theme = document.querySelector('[data-reading-theme]');
  if (theme) theme.hidden = false;
  try { const value = localStorage.getItem('theme'); if (['light', 'dark'].includes(value)) document.documentElement.dataset.theme = value; } catch {}
  theme?.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', dark ? 'light' : 'dark'); } catch {}
  });
}
