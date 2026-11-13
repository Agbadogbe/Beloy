/*
  Copy by key. Two files, same keys: src/i18n/fr.js and src/i18n/en.js.
  `node scripts/check.js` fails if the two drift apart.

  t('flow.cover.title')                     -> string
  t('flow.cover.total.per', { amount })     -> string with {amount} replaced
*/

import fr from './i18n/fr.js';
import en from './i18n/en.js';

const catalogues = { fr, en };
const INTL_LOCALES = { fr: 'fr-FR', en: 'en-GB' };

let current = 'fr';

export function setLocale(locale) {
  if (!catalogues[locale]) return;
  current = locale;
  document.documentElement.lang = locale;
}

export const getLocale = () => current;
export const getIntlLocale = () => INTL_LOCALES[current];
export const locales = Object.keys(catalogues);

export function t(key, params = {}) {
  const value = catalogues[current][key];
  if (value === undefined) {
    console.warn(`[i18n] missing key "${key}" in ${current}`);
    return key;
  }
  if (typeof value !== 'string') return value;
  return value.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

/* For non-string copy values, e.g. the marketing "from" amount. */
export const copyValue = (key) => catalogues[current][key];
