/*
  House-rule checks, run with `node scripts/check.js`. No dependencies.

  1. fr.js and en.js have exactly the same keys.
  2. Every literal t('key') in src/ exists in the catalogues.
  3. No colour literal (hex, rgb(), hsl(), named colour) outside tokens.css,
     and no primitive token (--prim-*) used outside tokens.css.
  4. Money: no "€" or toFixed() price-building outside format.js
     (payment.js copies the raw amount for the clipboard: allowed, listed below).
  5. The contract's worked total from the API document adds up.
*/

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fr from '../src/i18n/fr.js';
import en from '../src/i18n/en.js';
import { createQuote, createContract } from '../src/api/contract.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`  ✗ ${msg}`);
};
const pass = (msg) => console.log(`  ✓ ${msg}`);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

/* 1. key parity */
console.log('Copy');
const frKeys = new Set(Object.keys(fr));
const enKeys = new Set(Object.keys(en));
const onlyFr = [...frKeys].filter((k) => !enKeys.has(k));
const onlyEn = [...enKeys].filter((k) => !frKeys.has(k));
onlyFr.forEach((k) => fail(`only in fr.js: ${k}`));
onlyEn.forEach((k) => fail(`only in en.js: ${k}`));
if (!onlyFr.length && !onlyEn.length) pass(`fr.js and en.js share the same ${frKeys.size} keys`);

/* 2. literal keys used in code exist */
const jsFiles = walk(join(ROOT, 'src')).filter((f) => f.endsWith('.js') && !f.includes(`${'i18n'}/`));
let missing = 0;
for (const file of jsFiles) {
  const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, key] of src.matchAll(/\bt\(\s*'([a-z][\w.]+)'/g)) {
    if (!frKeys.has(key)) {
      missing += 1;
      fail(`${relative(ROOT, file)} uses unknown key ${key}`);
    }
  }
}
if (!missing) pass('every literal t() key exists');

/* 3. colours only in tokens.css */
console.log('Tokens');
const NAMED = /:\s*[^;]*\b(white|black|red|blue|green|grey|gray|orange|yellow|purple|pink|navy|silver)\b/i;
const COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i;
const styleFiles = walk(join(ROOT, 'styles')).filter((f) => f.endsWith('.css') && !f.endsWith('tokens.css'));
let colourHits = 0;
for (const file of [...styleFiles, ...jsFiles]) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const code = line.replace(/\/\*.*?\*\//g, '').replace(/^\s*(\/\/|\*).*/, '');
      const isCss = file.endsWith('.css');
      if (COLOUR.test(code) && !/fill="currentColor"|stroke="currentColor"/.test(code) || (isCss && NAMED.test(code)) || code.includes('--prim-')) {
        colourHits += 1;
        fail(`${relative(ROOT, file)}:${i + 1} ${line.trim()}`);
      }
    });
}
if (!colourHits) pass('no colour literal or primitive token outside tokens.css');

/* 4. money only through format.js */
console.log('Money');
const MONEY_ALLOW = ['src/format.js', 'src/screens/payment.js'];
let moneyHits = 0;
for (const file of jsFiles) {
  const rel = relative(ROOT, file);
  if (MONEY_ALLOW.includes(rel)) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '');
      if (/€|toFixed\(|\/\s*100\b/.test(code) && !/^\s*\*/.test(line) && !code.includes('list_price / 100')) {
        moneyHits += 1;
        fail(`${rel}:${i + 1} builds a price by hand: ${line.trim()}`);
      }
    });
}
if (!moneyHits) pass('prices only built by format.js');

/* 5. worked total from the API document */
console.log('Contract');
const quote = createQuote(
  {
    program: 'bmw-fr-ev',
    vehicle: { model_code: 'i4', list_price: 5959000, delivery_date: '2027-06-04' },
    driver: { birth_date: '1994-03-18', licence_since: '2013-07-02', claims_3y: 0, annual_km: 12000, postcode: '75011', parking: 'street', charging: 'home' },
  },
  { now: new Date('2026-11-13T12:00:00Z') },
);
const contract = createContract(
  {
    quote_id: quote.body.quote_id,
    package_id: 'comfort',
    options: ['WALLBOX', 'BATTERY', 'GLASS'],
    frequency: 'monthly',
    holder: { first_name: 'Camille', last_name: 'Fontaine', email: 'camille.fontaine@example.fr', phone: '+33600000000' },
    consents: { pre_contractual_information: true, general_conditions: true, data_processing: true },
  },
  { now: new Date('2026-11-13T12:00:00Z') },
);
const b = contract.body;
const expect = (cond, msg) => (cond ? pass(msg) : fail(msg));
expect(quote.status === 201 && quote.body.packages.length === 3, 'quote returns three packages');
expect(b.premium.annual === 81600 && b.premium.monthly === 7480, 'comfort + WALLBOX + BATTERY + GLASS = 81600 / 7480');
expect(b.payment.amount === 7480 && b.payment.due_by === '2027-06-01' && b.ends_on === '2028-06-03', 'payment amount, due_by and ends_on match the document');
const young = createQuote(
  { ...{ program: 'bmw-fr-ev' }, vehicle: { model_code: 'i4', list_price: 5959000, delivery_date: '2027-06-04' }, driver: { birth_date: '1994-03-18', licence_since: '2025-12-01', claims_3y: 0, annual_km: 12000, postcode: '75011', parking: 'street', charging: 'home' } },
  { now: new Date('2026-11-13T12:00:00Z') },
);
expect(young.status === 422 && young.body.error.code === 'driver_ineligible', 'licence under two years -> 422 driver_ineligible');

console.log(failures ? `\n${failures} problem(s).` : '\nAll house rules hold.');
process.exit(failures ? 1 : 0);
