/*
  One command: `node server.js` (Node 18+, no dependencies).

  - Serves the front end as static files.
  - Serves the Ardenne Assurance mock API on the same port, using the same
    contract module the browser stub uses (src/api/contract.js).

  http://127.0.0.1:4000
*/

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createQuote, createContract, simulated, PROGRAM } from './src/api/contract.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, x-program, x-simulate, x-latency',
};

const routes = {
  '/v1/quotes': createQuote,
  '/v1/contracts': createContract,
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...CORS });
  res.end(JSON.stringify(body, null, 2));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const requestError = (message) => ({ error: { code: 'invalid_request', message, request_id: `req_${Date.now().toString(16)}` } });

async function handleApi(req, res, path) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }
  if (req.method !== 'POST') return sendJson(res, 400, requestError('Use POST'));
  if (req.headers['x-program'] !== PROGRAM) return sendJson(res, 400, requestError(`x-program header must be ${PROGRAM}`));

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return sendJson(res, 400, requestError('Body is not valid JSON'));
  }

  const latency = Math.min(Number(req.headers['x-latency'] ?? 0) || 0, 10000);
  if (latency) await wait(latency);

  const result = simulated(req.headers['x-simulate'], path) ?? routes[path](body);
  console.log(`${new Date().toISOString()} POST ${path} -> ${result.status}${result.body.error ? ` ${result.body.error.code}` : ''}`);
  return sendJson(res, result.status, result.body);
}

async function handleStatic(req, res, pathname) {
  const relative = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const file = normalize(join(ROOT, relative));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end();
  }
  try {
    const content = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(content);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (routes[pathname]) return await handleApi(req, res, pathname);
    return await handleStatic(req, res, pathname);
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: { code: 'internal_error', message: String(err), request_id: 'req_server' } });
  }
}).listen(PORT, HOST, () => {
  console.log(`BMW EV cover flow and Ardenne mock API on http://${HOST}:${PORT}`);
});
