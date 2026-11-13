/*
  The only module that talks to the API.

  Every call resolves to either { ok: true, data } or { ok: false, problem }.
  `problem` is one of OUR keys (see PROBLEMS), never the API's code or message:
  screens turn it into words with i18n. The raw error goes to the console.
*/

import { config } from '../config.js';
import { stubFetch } from './stub.js';

/* API error code -> what the screen should explain. */
const PROBLEMS = {
  invalid_request: 'invalid',
  quote_not_found: 'expired',     // for the customer, a lost quote is the same story as an expired one
  quote_expired: 'expired',
  driver_ineligible: 'ineligible',
  consent_required: 'consent',
  internal_error: 'unavailable',
};

let useStub = config.API_MODE === 'stub';

async function send(path, body) {
  if (!useStub) {
    try {
      const response = await fetch(`${config.API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-program': config.PROGRAM,
          ...(config.SIMULATE ? { 'x-simulate': config.SIMULATE } : {}),
          ...(config.LATENCY_MS ? { 'x-latency': String(config.LATENCY_MS) } : {}),
        },
        body: JSON.stringify(body),
      });
      return response;
    } catch (networkError) {
      if (config.API_MODE !== 'auto') throw networkError;
      console.info(`[api] ${config.API_BASE_URL} did not answer, using the in-browser stub from now on.`);
      useStub = true;
    }
  }
  return stubFetch(path, body);
}

async function call(path, body, { retries = 0 } = {}) {
  let response;
  try {
    response = await send(path, body);
  } catch (networkError) {
    console.error(`[api] POST ${path} network failure`, networkError);
    return { ok: false, problem: 'offline' };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* empty or non-JSON body, handled below */
  }

  if (response.ok && payload) return { ok: true, data: payload };

  const code = payload?.error?.code ?? 'unknown';
  console.error(
    `[api] POST ${path} -> ${response.status} ${code}`,
    payload?.error?.message ?? '',
    payload?.error?.request_id ?? '',
  );

  // 500 is documented as "safe to retry once".
  if (response.status >= 500 && retries > 0) {
    console.info(`[api] retrying ${path} once`);
    return call(path, body, { retries: retries - 1 });
  }

  return { ok: false, problem: PROBLEMS[code] ?? 'unavailable' };
}

export const api = {
  createQuote: (body) => call('/v1/quotes', { program: config.PROGRAM, ...body }, { retries: 1 }),
  createContract: (body) => call('/v1/contracts', body, { retries: 1 }),
};
