/*
  Step 2, the driver. Everything the quote needs about who drives and
  where the car sleeps and charges. Validation happens on submit, then
  live on the fields that were wrong, so nobody is scolded mid-typing.
*/

import { html, render } from '../html.js';
import { t } from '../i18n.js';
import { formatNumber, monthNames } from '../format.js';
import { stepHeader, actions } from '../components/layout.js';
import { textField, dateField, choiceGroup, focusFirstError, clearError } from '../components/fields.js';
import { state } from '../store.js';

const KM_CHOICES = [5000, 10000, 15000, 20000, 30000];
const CLAIMS_CHOICES = [0, 1, 2, 3];

const todayIso = () => new Date().toISOString().slice(0, 10);
let errors = {};
let submitted = false;

/*
  The two dates are typed as day / month / year selects. What the customer
  has picked so far lives here, so a half-filled date survives a re-render;
  state.driver only holds a date once all three parts are chosen.
*/
let parts = {};
const splitIso = (iso) => {
  const [year = '', month = '', day = ''] = (iso || '').split('-');
  return { day, month, year };
};
const partsOf = (id) => (parts[id] ??= splitIso(state.driver[id]));

/* Newest first: the years people actually pick are near the top. */
const yearsBack = (from, count) => Array.from({ length: count }, (_, i) => from - i);
const thisYear = () => new Date().getUTCFullYear();

const isRealDate = (iso) => new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) === iso;

function dateProblem(id) {
  const p = partsOf(id);
  const filled = [p.day, p.month, p.year].filter(Boolean).length;
  if (filled === 0) return 'error.required';
  if (filled < 3) return 'flow.driver.error.dateIncomplete';
  if (!isRealDate(state.driver[id])) return 'flow.driver.error.dateInvalid';
  return null;
}

function yearsSince(iso) {
  const from = new Date(`${iso}T00:00:00Z`);
  const now = new Date();
  let years = now.getUTCFullYear() - from.getUTCFullYear();
  if (now.getUTCMonth() < from.getUTCMonth() || (now.getUTCMonth() === from.getUTCMonth() && now.getUTCDate() < from.getUTCDate())) years -= 1;
  return years;
}

/*
  Format checks only. Eligibility (licence < 2 years, 3+ claims) is the
  carrier's decision: we send it and explain the API's answer, we do not
  pre-judge it here.
*/
function validate() {
  const d = state.driver;
  errors = {};
  const birthProblem = dateProblem('birth_date');
  if (birthProblem) errors.birth_date = birthProblem;
  else if (d.birth_date >= todayIso()) errors.birth_date = 'flow.driver.error.birthFuture';
  else if (yearsSince(d.birth_date) < 18) errors.birth_date = 'flow.driver.error.under18';

  const licenceProblem = dateProblem('licence_since');
  if (licenceProblem) errors.licence_since = licenceProblem;
  else if (d.licence_since > todayIso()) errors.licence_since = 'flow.driver.error.licenceFuture';
  else if (!birthProblem && d.licence_since < d.birth_date) errors.licence_since = 'flow.driver.error.licenceBeforeBirth';

  if (d.claims_3y === null) errors.claims_3y = 'error.choose';
  if (d.annual_km === null) errors.annual_km = 'error.choose';
  if (!/^\d{5}$/.test(d.postcode)) errors.postcode = 'flow.driver.error.postcode';
  if (!d.parking) errors.parking = 'error.choose';
  if (!d.charging) errors.charging = 'error.choose';
  return Object.keys(errors).length === 0;
}

export default {
  id: 'driver',

  render(root, ctx) {
    const d = state.driver;
    const dateCommon = {
      months: monthNames(),
      labels: { day: t('date.day'), month: t('date.month'), year: t('date.year') },
    };
    render(
      root,
      html`
        <form class="container container--narrow step" novalidate>
          ${stepHeader({ eyebrow: t('flow.driver.eyebrow'), title: t('flow.driver.title'), lead: t('flow.driver.lead') })}

          <section class="card stack" aria-labelledby="driver-about">
            <h2 class="card__title" id="driver-about">${t('flow.driver.section.about')}</h2>
            ${dateField({ ...dateCommon, id: 'birth_date', label: t('flow.driver.birthDate'), parts: partsOf('birth_date'), years: yearsBack(thisYear() - 18, 83), error: errors.birth_date && t(errors.birth_date) })}
            ${dateField({ ...dateCommon, id: 'licence_since', label: t('flow.driver.licenceSince'), hint: t('flow.driver.licenceHint'), parts: partsOf('licence_since'), years: yearsBack(thisYear(), 83), error: errors.licence_since && t(errors.licence_since) })}
            ${choiceGroup({
              name: 'claims_3y',
              legend: t('flow.driver.claims'),
              hint: t('flow.driver.claimsHint'),
              value: d.claims_3y,
              error: errors.claims_3y && t(errors.claims_3y),
              options: CLAIMS_CHOICES.map((n) => ({ value: n, label: n === 3 ? t('flow.driver.claimsMore') : formatNumber(n) })),
            })}
          </section>

          <section class="card stack" aria-labelledby="driver-use">
            <h2 class="card__title" id="driver-use">${t('flow.driver.section.use')}</h2>
            ${choiceGroup({
              name: 'annual_km',
              legend: t('flow.driver.km'),
              hint: t('flow.driver.kmHint'),
              value: d.annual_km,
              error: errors.annual_km && t(errors.annual_km),
              options: KM_CHOICES.map((km, i) => ({
                value: km,
                label: i === KM_CHOICES.length - 1 ? t('flow.driver.kmMore', { km: formatNumber(km) }) : t('flow.driver.kmUpTo', { km: formatNumber(km) }),
              })),
            })}
            ${textField({ id: 'postcode', label: t('flow.driver.postcode'), hint: t('flow.driver.postcodeHint'), inputmode: 'numeric', autocomplete: 'postal-code', value: d.postcode, error: errors.postcode && t(errors.postcode) })}
          </section>

          <section class="card stack" aria-labelledby="driver-home">
            <h2 class="card__title" id="driver-home">${t('flow.driver.section.home')}</h2>
            ${choiceGroup({
              name: 'parking',
              legend: t('flow.driver.parking'),
              value: d.parking,
              error: errors.parking && t(errors.parking),
              variant: 'cards',
              options: [
                { value: 'garage', icon: 'garage', label: t('flow.driver.parking.garage'), detail: t('flow.driver.parking.garageDetail') },
                { value: 'driveway', icon: 'driveway', label: t('flow.driver.parking.driveway'), detail: t('flow.driver.parking.drivewayDetail') },
                { value: 'street', icon: 'street', label: t('flow.driver.parking.street'), detail: t('flow.driver.parking.streetDetail') },
              ],
            })}
            ${choiceGroup({
              name: 'charging',
              legend: t('flow.driver.charging'),
              value: d.charging,
              error: errors.charging && t(errors.charging),
              variant: 'cards',
              options: [
                { value: 'home', icon: 'home', label: t('flow.driver.charging.home'), detail: t('flow.driver.charging.homeDetail') },
                { value: 'work', icon: 'work', label: t('flow.driver.charging.work'), detail: t('flow.driver.charging.workDetail') },
                { value: 'public', icon: 'station', label: t('flow.driver.charging.public'), detail: t('flow.driver.charging.publicDetail') },
              ],
            })}
          </section>

          ${actions({ back: 'vehicle', primaryLabel: t('flow.driver.continue') })}
        </form>`,
    );

    const form = root.querySelector('form');
    const NUMERIC = ['claims_3y', 'annual_km'];

    form.addEventListener('input', (e) => {
      const { name, value, dataset } = e.target;
      if (dataset.date) {
        const p = partsOf(dataset.date);
        p[dataset.part] = value;
        d[dataset.date] = p.day && p.month && p.year ? `${p.year}-${p.month}-${p.day}` : '';
        return;
      }
      if (!(name in d)) return;
      d[name] = NUMERIC.includes(name) ? Number(value) : value.trim();
    });

    // After a failed submit, clear each error as soon as the field is fixed.
    // On `input`, not `change`: `change` fires on blur, i.e. on the mousedown
    // of the next click; the message vanishing then shifts the layout and the
    // mouseup lands elsewhere, so the click is lost. Errors are only ever
    // removed here, never added, so nobody is scolded mid-typing.
    form.addEventListener('input', (e) => {
      const name = e.target.dataset.date ?? e.target.name;
      if (!submitted || !errors[name]) return;
      validate();
      if (!errors[name]) clearError(form, name);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted = true;
      if (!validate()) return ctx.rerender(null, focusFirstError);
      ctx.complete('driver');
      ctx.go('cover');
    });
  },

  reset() {
    errors = {};
    submitted = false;
    parts = {};
  },
};
