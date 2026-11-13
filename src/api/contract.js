/*
  The Ardenne Assurance contract, written once.

  Pure functions: (request body) -> { status, body }. No DOM, no Node APIs,
  so the same file runs in two places:
    - server.js (the mock API on http://127.0.0.1:4000), and
    - src/api/stub.js (an in-browser fallback when no server is running).

  Figures are the ones from the API document. They are fixed: any valid
  request returns the same three packages.
*/

export const PROGRAM = 'bmw-fr-ev';
export const MODELS = ['i4', 'i5', 'i7', 'iX1', 'iX2', 'iX3'];
export const PARKING = ['garage', 'driveway', 'street'];
export const CHARGING = ['home', 'work', 'public'];
export const FREQUENCIES = ['annual', 'monthly'];
export const OPTION_CODES = ['WALLBOX', 'CABLE', 'BATTERY', 'STRANDED', 'GLASS'];

const opt = (code, included, annual, monthly) => ({ code, included, price: { annual, monthly } });

const PACKAGES = [
  {
    id: 'essential',
    price: { annual: 42000, monthly: 3850 },
    options: [
      opt('WALLBOX', false, 4800, 440),
      opt('CABLE', false, 2400, 220),
      opt('BATTERY', false, 9600, 880),
      opt('STRANDED', false, 3600, 330),
      opt('GLASS', false, 6000, 550),
    ],
  },
  {
    id: 'comfort',
    price: { annual: 61200, monthly: 5610 },
    options: [
      opt('WALLBOX', false, 4800, 440),
      opt('CABLE', true, 0, 0),
      opt('BATTERY', false, 9600, 880),
      opt('STRANDED', true, 0, 0),
      opt('GLASS', false, 6000, 550),
    ],
  },
  {
    id: 'integral',
    price: { annual: 86400, monthly: 7920 },
    options: [
      opt('WALLBOX', true, 0, 0),
      opt('CABLE', true, 0, 0),
      opt('BATTERY', false, 9600, 880),
      opt('STRANDED', true, 0, 0),
      opt('GLASS', true, 0, 0),
    ],
  },
];

const QUOTE_ID = 'qt_7f3a91c2';
const QUOTE_EXPIRES_AT = '2027-05-21T10:00:00Z';

// Quotes issued by this instance, so /v1/contracts can find them again.
const quotes = new Map();

let requestCounter = 0;
const requestId = () => `req_${(0x41d9c0a7 + requestCounter++).toString(16)}`;

const error = (status, code, message) => ({
  status,
  body: { error: { code, message, request_id: requestId() } },
});

/* ---------- small validators ---------- */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  // Rejects 2027-02-31 and the like: the date must survive the round trip.
  return d.toISOString().slice(0, 10) === value ? d : null;
}

function yearsBetween(from, to) {
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  const beforeAnniversary =
    to.getUTCMonth() < from.getUTCMonth() ||
    (to.getUTCMonth() === from.getUTCMonth() && to.getUTCDate() < from.getUTCDate());
  if (beforeAnniversary) years -= 1;
  return years;
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const isoDate = (d) => d.toISOString().slice(0, 10);
const isInt = (v) => Number.isInteger(v);

/* ---------- POST /v1/quotes ---------- */

export function createQuote(body, { now = new Date() } = {}) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const v = body?.vehicle ?? {};
  const d = body?.driver ?? {};

  if (body?.program !== PROGRAM) return error(400, 'invalid_request', 'program must be bmw-fr-ev');
  if (!MODELS.includes(v.model_code)) return error(400, 'invalid_request', 'vehicle.model_code is not a known model');
  if (!isInt(v.list_price) || v.list_price <= 0) return error(400, 'invalid_request', 'vehicle.list_price must be a positive integer in minor units');

  const delivery = parseDate(v.delivery_date);
  if (!delivery || delivery <= today) return error(400, 'invalid_request', 'vehicle.delivery_date must be a future date');

  const birth = parseDate(d.birth_date);
  if (!birth || yearsBetween(birth, today) < 18) return error(400, 'invalid_request', 'driver.birth_date: holder must be 18 or over');

  const licence = parseDate(d.licence_since);
  if (!licence || licence > today) return error(400, 'invalid_request', 'driver.licence_since must be a past date');

  if (!isInt(d.claims_3y) || d.claims_3y < 0) return error(400, 'invalid_request', 'driver.claims_3y must be a non-negative integer');
  if (!isInt(d.annual_km) || d.annual_km <= 0) return error(400, 'invalid_request', 'driver.annual_km must be a positive integer');
  if (typeof d.postcode !== 'string' || !/^\d{5}$/.test(d.postcode)) return error(400, 'invalid_request', 'driver.postcode must be five digits');
  if (!PARKING.includes(d.parking)) return error(400, 'invalid_request', 'driver.parking must be garage, driveway or street');
  if (!CHARGING.includes(d.charging)) return error(400, 'invalid_request', 'driver.charging must be home, work or public');

  // Eligibility: carrier decisions, both returned as 422.
  if (yearsBetween(licence, today) < 2) return error(422, 'driver_ineligible', 'Licence held for less than two years');
  if (d.claims_3y > 2) return error(422, 'driver_ineligible', 'More than two at-fault claims in the last three years');

  const quote = {
    quote_id: QUOTE_ID,
    currency: 'EUR',
    expires_at: QUOTE_EXPIRES_AT,
    packages: structuredClone(PACKAGES),
  };
  quotes.set(QUOTE_ID, { quote, request: structuredClone(body) });
  return { status: 201, body: quote };
}

/* ---------- POST /v1/contracts ---------- */

export function createContract(body, { now = new Date() } = {}) {
  const stored = quotes.get(body?.quote_id);
  if (!stored) return error(404, 'quote_not_found', `No quote with id ${body?.quote_id}`);

  const { quote, request } = stored;
  if (now > new Date(quote.expires_at)) {
    return error(409, 'quote_expired', `Quote ${quote.quote_id} expired at ${quote.expires_at}`);
  }

  const pkg = quote.packages.find((p) => p.id === body.package_id);
  if (!pkg) return error(400, 'invalid_request', 'package_id is not in the quote');

  if (!FREQUENCIES.includes(body.frequency)) return error(400, 'invalid_request', 'frequency must be annual or monthly');

  if (!Array.isArray(body.options)) return error(400, 'invalid_request', 'options must be an array');
  const chosen = [...new Set(body.options)];
  for (const code of chosen) {
    const option = pkg.options.find((o) => o.code === code);
    if (!option) return error(400, 'invalid_request', `Unknown option ${code}`);
    if (option.included) return error(400, 'invalid_request', `Option ${code} is already included in ${pkg.id}`);
  }

  const h = body.holder ?? {};
  for (const field of ['first_name', 'last_name', 'email', 'phone']) {
    if (typeof h[field] !== 'string' || !h[field].trim()) return error(400, 'invalid_request', `holder.${field} is required`);
  }

  const c = body.consents ?? {};
  const consentsGiven = ['pre_contractual_information', 'general_conditions', 'data_processing'].every((k) => c[k] === true);
  if (!consentsGiven) return error(422, 'consent_required', 'All three consents must be true');

  // Package price plus every selected add-on. No bundle discount.
  const premium = { annual: pkg.price.annual, monthly: pkg.price.monthly };
  for (const code of chosen) {
    const option = pkg.options.find((o) => o.code === code);
    premium.annual += option.price.annual;
    premium.monthly += option.price.monthly;
  }

  const startsOn = parseDate(request.vehicle.delivery_date);
  const endsOn = addDays(new Date(Date.UTC(startsOn.getUTCFullYear() + 1, startsOn.getUTCMonth(), startsOn.getUTCDate())), -1);
  const dueBy = addDays(startsOn, -3);

  return {
    status: 201,
    body: {
      contract_id: 'ctr_8d41b06f',
      policy_number: 'ARD-FR-2026-0481233',
      status: 'issued',
      starts_on: isoDate(startsOn),
      ends_on: isoDate(endsOn),
      premium: { ...premium, frequency: body.frequency },
      payment: {
        method: 'atm_reference',
        entity: '21456',
        reference: '907318442',
        amount: premium[body.frequency],
        due_by: isoDate(dueBy),
      },
    },
  };
}

/*
  Failure simulation, so every error screen can be shown on demand.
  Add ?simulate=<case> to the page URL (see README). Used by stub and server.
*/
export function simulated(kind, path) {
  if (kind === 'server_error') return error(500, 'internal_error', 'Simulated internal error');
  if (kind === 'expired' && path === '/v1/contracts') {
    return error(409, 'quote_expired', `Quote ${QUOTE_ID} expired at ${QUOTE_EXPIRES_AT}`);
  }
  return null;
}
