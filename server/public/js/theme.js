/**
 * Theme Switcher Utility
 * Handles dark/light theme switching and persistence
 */

(() => {
  try {
    const stored = localStorage.getItem('themeMode');
    if (stored ? stored === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  } catch (_) {}
  
  document.addEventListener('basecoat:theme', (e) => {
    const mode = e.detail?.mode || (document.documentElement.classList.contains('dark') ? 'light' : 'dark');
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('themeMode', mode);
  });
})();
