import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const code = readFileSync(new URL('../public/js/theme.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../public/css/theme.css', import.meta.url), 'utf8');

function boot({ preferredDark = false, initialChoice, blockedStorage = false } = {}) {
  const attrs = new Map();
  const buttonAttrs = new Map();
  const storage = new Map();
  if (initialChoice) storage.set('drumradar-appearance', initialChoice);
  const icon = { textContent: '' };
  const label = { textContent: '' };
  let click;
  const button = {
    title: '',
    setAttribute: (name, value) => buttonAttrs.set(name, value),
    getAttribute: name => buttonAttrs.get(name),
    addEventListener: (name, cb) => { if (name === 'click') click = cb; },
    querySelector: selector => selector === '.theme-toggle-icon' ? icon : selector === '.theme-toggle-text' ? label : null,
  };
  const meta = { setAttribute(name, value) { attrs.set(`meta-${name}`, value); } };
  const doc = {
    readyState: 'complete',
    documentElement: { setAttribute(name, value) { attrs.set(name, value); }, getAttribute: name => attrs.get(name) },
    querySelector: selector => selector === 'meta[name="color-scheme"]' ? meta : null,
    getElementById: id => id === 'theme-toggle' ? button : null,
  };
  let change;
  const media = { matches: preferredDark, addEventListener: (name, cb) => { if (name === 'change') change = cb; } };
  const localStorage = {
    getItem(key) { if (blockedStorage) throw Error('denied'); return storage.get(key) ?? null; },
    setItem(key, value) { if (blockedStorage) throw Error('denied'); storage.set(key, value); },
  };
  runInNewContext(code, { document: doc, window: { localStorage, matchMedia: () => media } });
  return {
    get theme() { return attrs.get('data-theme'); },
    get colorScheme() { return attrs.get('meta-content'); },
    get accessibleAction() { return button.getAttribute('aria-label'); },
    get pressed() { return button.getAttribute('aria-pressed'); },
    get icon() { return icon.textContent; },
    get label() { return label.textContent; },
    get saved() { return storage.get('drumradar-appearance'); },
    click: () => click(),
    setSystemPreference: value => { media.matches = value; change(); },
  };
}

test('appearance assets are linked from the actual app entrypoint', () => {
  assert.match(html, /js\/theme\.js/);
  assert.match(html, /css\/theme\.css/);
  assert.match(html, /id="theme-toggle"/);
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(html, /js\/app\.js/);
});

test('system dark preference applies on first visit', () => {
  const ui = boot({ preferredDark: true });
  assert.equal(ui.theme, 'dark');
  assert.equal(ui.colorScheme, 'dark');
  assert.equal(ui.pressed, 'true');
  assert.equal(ui.accessibleAction, 'Switch to light mode');
  assert.equal(ui.label, 'Light');
});

test('user can switch to light and preference is persisted', () => {
  const ui = boot({ preferredDark: true });
  ui.click();
  assert.equal(ui.theme, 'light');
  assert.equal(ui.saved, 'light');
  assert.equal(ui.pressed, 'false');
  assert.equal(ui.icon, '☾');
  ui.setSystemPreference(false);
  assert.equal(ui.theme, 'light');
  ui.setSystemPreference(true);
  assert.equal(ui.theme, 'light');
});

test('stored choice overrides OS preference and toggle works both ways', () => {
  const ui = boot({ preferredDark: false, initialChoice: 'dark' });
  assert.equal(ui.theme, 'dark');
  ui.click();
  assert.equal(ui.theme, 'light');
  ui.click();
  assert.equal(ui.theme, 'dark');
});

test('switch still works if storage is unavailable', () => {
  const ui = boot({ blockedStorage: true });
  assert.equal(ui.theme, 'light');
  ui.click();
  assert.equal(ui.theme, 'dark');
});

test('follows operating system changes while no preference is stored', () => {
  const ui = boot({ preferredDark: false });
  ui.setSystemPreference(true);
  assert.equal(ui.theme, 'dark');
  ui.setSystemPreference(false);
  assert.equal(ui.theme, 'light');
});
