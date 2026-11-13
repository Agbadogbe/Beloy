/*
  The one place money, dates and numbers become text.

  Money arrives from the API as integer minor units (42000 = 420,00 €).
  It is divided by 100 here, at display time, and nowhere else.
*/

import { getIntlLocale } from './i18n.js';

const CURRENCY = 'EUR';
const cache = new Map();

function formatter(key, factory) {
  const id = `${key}|${getIntlLocale()}`;
  if (!cache.has(id)) cache.set(id, factory(getIntlLocale()));
  return cache.get(id);
}

/** formatMoney(7480) -> "74,80 €" (fr) / "€74.80" (en) */
export function formatMoney(minorUnits) {
  if (!Number.isInteger(minorUnits)) throw new TypeError(`formatMoney expects integer minor units, got ${minorUnits}`);
  return formatter('money', (locale) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2 }),
  ).format(minorUnits / 100);
}

/** List prices: whole euros, no cents. formatMoneyWhole(5959000) -> "59 590 €" */
export function formatMoneyWhole(minorUnits) {
  if (!Number.isInteger(minorUnits)) throw new TypeError(`formatMoneyWhole expects integer minor units, got ${minorUnits}`);
  return formatter('moneyWhole', (locale) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }),
  ).format(minorUnits / 100);
}

/** "2027-06-04" -> "4 juin 2027". Calendar dates are read as UTC so no timezone shifts the day. */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  return formatter('date', (locale) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  ).format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatNumber(value) {
  return formatter('number', (locale) => new Intl.NumberFormat(locale)).format(value);
}

/** "907318442" -> "907 318 442": groups of three, easier to copy down. */
export const groupDigits = (digits) => String(digits).replace(/(\d{3})(?=\d)/g, '$1 ');
