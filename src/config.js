/*
  Configuration. The base URL lives here and only here: it is the one line
  that differs between a laptop, a test environment and production.
*/

const params = new URLSearchParams(window.location.search);

export const config = {
  API_BASE_URL: 'http://127.0.0.1:4000',
  PROGRAM: 'bmw-fr-ev',

  /*
    'auto': call the API; if nothing answers (no server running), fall back
            to the in-browser stub and say so in the console.
    'http': always call the API.
    'stub': never call the network.
  */
  API_MODE: params.get('api') ?? 'auto',

  /* Demo helpers for the review, all off by default:
     ?demo=1                 prefill the forms with the API document's test driver
     ?simulate=server_error  every call fails with a 500
     ?simulate=expired       issuing the contract fails with 409 quote_expired
     ?latency=1500           slow every call down, to look at the wait states */
  DEMO: params.get('demo') === '1',
  SIMULATE: params.get('simulate'),
  LATENCY_MS: Number(params.get('latency') ?? 600),

  DEFAULT_LOCALE: 'fr',
};
