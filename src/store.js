/*
  The flow's state, in memory only (a reload starts again, as the brief allows).
  Screens read `state` and change it through the functions below.
*/

import { order, demoDriver, demoHolder } from './data/order.js';
import { config } from './config.js';

export const state = {
  vehicle: {
    model_code: order.model_code,
    list_price: order.list_price,
    delivery_date: order.delivery_date,
    confirmed: false,
    editing: false,
  },

  driver: config.DEMO
    ? { ...demoDriver }
    : { birth_date: '', licence_since: '', claims_3y: null, annual_km: null, postcode: '', parking: '', charging: '' },

  // Quote lifecycle: idle -> loading -> ready | error
  quote: { status: 'idle', data: null, problem: null, requestKey: null },

  // Nothing selected when the cover screen opens.
  selection: { packageId: null, options: new Set(), frequency: 'monthly' },

  holder: config.DEMO ? { ...demoHolder } : { first_name: '', last_name: '', email: '', phone: '' },
  consents: { pre_contractual_information: false, general_conditions: false, data_processing: false },

  // Contract lifecycle: idle -> loading -> issued | error
  contract: { status: 'idle', data: null, problem: null },
};

/* The body of POST /v1/quotes, built from what the customer told us. */
export function quoteRequest() {
  const { model_code, list_price, delivery_date } = state.vehicle;
  return { vehicle: { model_code, list_price, delivery_date }, driver: { ...state.driver } };
}

/* A quote is stale as soon as the vehicle or driver answers change. */
export const quoteIsCurrent = () =>
  state.quote.status === 'ready' && state.quote.requestKey === JSON.stringify(quoteRequest());

export function selectPackage(packageId) {
  state.selection.packageId = packageId;
  // Drop add-ons the new package already includes: they cannot be bought twice.
  const pkg = selectedPackage();
  for (const code of [...state.selection.options]) {
    if (pkg?.options.find((o) => o.code === code)?.included) state.selection.options.delete(code);
  }
}

export function toggleOption(code, on) {
  if (on) state.selection.options.add(code);
  else state.selection.options.delete(code);
}

export const selectedPackage = () =>
  state.quote.data?.packages.find((p) => p.id === state.selection.packageId) ?? null;

/*
  The running total, straight from the quote's figures for the chosen
  frequency: package price + each selected, not-included add-on.
  Never derives monthly from annual or the other way round.
*/
export function total() {
  const pkg = selectedPackage();
  if (!pkg) return null;
  const f = state.selection.frequency;
  return pkg.options
    .filter((o) => !o.included && state.selection.options.has(o.code))
    .reduce((sum, o) => sum + o.price[f], pkg.price[f]);
}

/* Options to send to /v1/contracts: chosen ones only, never the included ones. */
export const chosenOptionCodes = () => {
  const pkg = selectedPackage();
  return pkg ? pkg.options.filter((o) => !o.included && state.selection.options.has(o.code)).map((o) => o.code) : [];
};

export function resetAfterQuote() {
  state.selection.packageId = null;
  state.selection.options.clear();
  state.contract = { status: 'idle', data: null, problem: null };
}
