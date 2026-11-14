/* DrumRadar appearance switcher. Runs before CSS is parsed to avoid a bright flash. */
(() => {
  'use strict';
  const STORAGE_KEY = 'drumradar-appearance';
  const media = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  function savedChoice() {
    try {
      const choice = window.localStorage.getItem(STORAGE_KEY);
      return choice === 'light' || choice === 'dark' ? choice : null;
    } catch {
      // WebStorm private previews can restrict localStorage. The switch still works.
      return null;
    }
  }

  function preferredTheme() {
    return savedChoice() || (media?.matches ? 'dark' : 'light');
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    const nextAction = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', isDark ? 'dark' : 'light');

    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', `Switch to ${nextAction} mode`);
    toggle.title = `Switch to ${nextAction} mode`;
    const icon = toggle.querySelector('.theme-toggle-icon');
    const label = toggle.querySelector('.theme-toggle-text');
    if (icon) icon.textContent = isDark ? '☀' : '☾';
    if (label) label.textContent = isDark ? 'Light' : 'Dark';
  }

  function mountToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    applyTheme(document.documentElement.getAttribute('data-theme') || preferredTheme());
    toggle.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* still toggle */ }
      applyTheme(next);
    });
  }

  applyTheme(preferredTheme());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountToggle, { once: true });
  } else {
    mountToggle();
  }
  media?.addEventListener?.('change', () => {
    if (!savedChoice()) applyTheme(preferredTheme());
  });
})();
