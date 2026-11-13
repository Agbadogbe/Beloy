/*
  In-browser stand-in for the API. Same contract, same figures, no server.
  Returns a Response-like object so client.js handles both paths the same way.
*/

import { createQuote, createContract, simulated } from './contract.js';
import { config } from '../config.js';

const routes = {
  '/v1/quotes': createQuote,
  '/v1/contracts': createContract,
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function stubFetch(path, body) {
  await wait(config.LATENCY_MS);
  const result = simulated(config.SIMULATE, path) ?? routes[path](body);
  return {
    ok: result.status >= 200 && result.status < 300,
    status: result.status,
    json: async () => structuredClone(result.body),
  };
}
