/*
  The shell: header, stepper, the current screen, footer.
  Routing is the URL hash (#/vehicle, #/driver...), so the phone's back
  button works. A step can only be entered once the steps before it are done.
*/

import { html, render } from './html.js';
import { t, setLocale, getLocale, locales } from './i18n.js';
import { config } from './config.js';
import { state } from './store.js';
import { stepper } from './components/stepper.js';
import { logoMark, icon } from './components/icons.js';

import landing from './screens/landing.js';
import vehicle from './screens/vehicle.js';
import driver from './screens/driver.js';
import cover from './screens/cover.js';
import review from './screens/review.js';
import payment from './screens/payment.js';

const STEPS = ['vehicle', 'driver', 'cover', 'review', 'payment'];
const SCREENS = { landing, vehicle, driver, cover, review, payment };

const completed = new Set();
let current = null;

const els = {
  header: document.querySelector('#site-header'),
  stepper: document.querySelector('#stepper'),
  main: document.querySelector('#main'),
  footer: document.querySelector('#site-footer'),
};

/* ---------- navigation ---------- */

function allowed(step) {
  if (step === 'landing') return state.contract.status !== 'issued';
  // Once the contract is issued, the reference is the only screen left.
  if (state.contract.status === 'issued') return step === 'payment';
  const index = STEPS.indexOf(step);
  if (step === 'payment') return false;
  return STEPS.slice(0, index).every((s) => completed.has(s));
}

function furthestAllowed() {
  if (state.contract.status === 'issued') return 'payment';
  return [...STEPS].reverse().find(allowed) ?? 'vehicle';
}

function stepFromHash() {
  const id = window.location.hash.replace(/^#\/?/, '') || 'landing';
  return SCREENS[id] ? id : 'landing';
}

const ctx = {
  go(step) {
    const target = step === 'landing' ? '#/' : `#/${step}`;
    if (window.location.hash === target) route();
    else window.location.hash = target;
  },
  complete(step) {
    completed.add(step);
  },
  /* Re-render the current screen, then put focus back where the user was. */
  rerender(focusSelector, after) {
    renderScreen({ focusSelector, after });
  },
};

/* ---------- rendering ---------- */

function renderHeader() {
  const onHero = current === 'landing';
  const other = locales.find((l) => l !== getLocale());
  const theme = document.documentElement.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  els.header.className = `site-header ${onHero ? 'site-header--hero' : ''}`;
  render(
    els.header,
    html`
      <div class="site-header__inner container">
        <a class="brand" href="#/" aria-label="${t('shell.homeLabel')}">
          ${logoMark()}
          <span class="brand__name">${t('shell.brand')}</span>
          <span class="brand__divider" aria-hidden="true"></span>
          <span class="brand__product">${t('shell.product')}</span>
        </a>
        <div class="site-header__tools">
          <button class="tool-button" type="button" id="toggle-theme" aria-pressed="${theme === 'dark'}">
            ${icon('moon')}<span>${t('shell.darkMode')}</span>
          </button>
          <button class="tool-button" type="button" id="toggle-locale" lang="${other}" aria-label="${t('shell.switchLocale')}">
            <span aria-hidden="true">${other.toUpperCase()}</span>
          </button>
        </div>
      </div>`,
  );
}

function renderFooter() {
  document.querySelector('.skip-link').textContent = t('shell.skip');
  render(
    els.footer,
    html`
      <div class="container site-footer__inner">
        <p>${t('shell.footer.carrier')}</p>
        <p>${t('shell.footer.disclaimer')}</p>
      </div>`,
  );
}

function renderStepper() {
  els.stepper.hidden = current === 'landing';
  if (current !== 'landing') render(els.stepper, stepper({ steps: STEPS, current, completed }));
}

function renderScreen({ focusSelector, after, newPage = false } = {}) {
  document.body.dataset.screen = current;
  document.title = t(`title.${current}`);
  renderHeader();
  renderStepper();
  SCREENS[current].render(els.main, ctx);

  if (newPage) {
    window.scrollTo({ top: 0 });
    els.main.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
  } else if (focusSelector) {
    els.main.querySelector(focusSelector)?.focus({ preventScroll: true });
  }
  after?.(els.main);
}

function route() {
  let step = stepFromHash();
  if (!allowed(step)) {
    step = furthestAllowed();
    window.history.replaceState(null, '', step === 'landing' ? '#/' : `#/${step}`);
  }
  const changed = step !== current;
  if (changed) SCREENS[current]?.reset?.();
  current = step;
  renderScreen({ newPage: changed });
}

/* ---------- global controls ---------- */

document.addEventListener('click', (e) => {
  if (e.target.closest('#toggle-locale')) {
    setLocale(locales.find((l) => l !== getLocale()));
    renderFooter();
    renderScreen({ focusSelector: null });
    document.querySelector('#toggle-locale')?.focus();
  }
  if (e.target.closest('#toggle-theme')) {
    const root = document.documentElement;
    const isDark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = isDark ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', root.dataset.theme);
    } catch {
      /* storage blocked: the choice lasts for this visit only */
    }
    renderHeader();
    document.querySelector('#toggle-theme')?.focus();
  }
});

/* ---------- start ---------- */

try {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.dataset.theme = saved;
} catch {
  /* ignore */
}
setLocale(new URLSearchParams(window.location.search).get('lang') ?? config.DEFAULT_LOCALE);
renderFooter();
window.addEventListener('hashchange', route);
route();
