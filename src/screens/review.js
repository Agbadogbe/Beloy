/*
  Step 4, review. Read the answers back, collect the holder's contact
  details and the three consents, hand over the pre-contractual documents,
  then issue the contract. Every failure is explained, never coded.
*/

import { html, render } from '../html.js';
import { t } from '../i18n.js';
import { formatMoney, formatMoneyWhole, formatDate, formatNumber } from '../format.js';
import { icon } from '../components/icons.js';
import { stepHeader, actions, problemPanel } from '../components/layout.js';
import { textField, checkbox, focusFirstError, clearError } from '../components/fields.js';
import { api } from '../api/client.js';
import { state, selectedPackage, total, chosenOptionCodes } from '../store.js';

const CONSENTS = ['pre_contractual_information', 'general_conditions', 'data_processing'];
const DOCUMENTS = ['ipid', 'precontract', 'conditions', 'privacy'];

let errors = {};
let submitted = false;

function validate() {
  const h = state.holder;
  errors = {};
  if (!h.first_name.trim()) errors.first_name = 'error.required';
  if (!h.last_name.trim()) errors.last_name = 'error.required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h.email.trim())) errors.email = 'flow.review.error.email';
  if (!/^\+?[\d\s.-]{9,}$/.test(h.phone.trim())) errors.phone = 'flow.review.error.phone';
  for (const key of CONSENTS) if (!state.consents[key]) errors[key] = 'flow.review.error.consent';
  return Object.keys(errors).length === 0;
}

/* "06 12 34 56 78" -> "+33612345678", the shape the API example uses. */
function normalisePhone(raw) {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0')) return `+33${digits.slice(1)}`;
  return digits;
}

const row = (label, value) => html`<div class="facts__row"><dt>${label}</dt><dd>${value}</dd></div>`;

function recap() {
  const v = state.vehicle;
  const d = state.driver;
  const pkg = selectedPackage();
  const f = state.selection.frequency;
  const options = chosenOptionCodes();
  const included = pkg.options.filter((o) => o.included).map((o) => t(`option.${o.code}.name`));

  return html`
    <section class="card recap" aria-labelledby="recap-vehicle">
      <div class="recap__head">
        <h2 class="card__title" id="recap-vehicle">${icon('car')}<span>${t('flow.review.vehicle')}</span></h2>
        <a class="button button--link" href="#/vehicle">${icon('edit')}<span>${t('common.edit')}<span class="visually-hidden"> ${t('flow.review.vehicle')}</span></span></a>
      </div>
      <dl class="facts">
        ${row(t('flow.vehicle.model'), t(`vehicle.model.${v.model_code}`))}
        ${row(t('flow.vehicle.listPrice'), formatMoneyWhole(v.list_price))}
        ${row(t('flow.review.startsOn'), formatDate(v.delivery_date))}
      </dl>
    </section>

    <section class="card recap" aria-labelledby="recap-driver">
      <div class="recap__head">
        <h2 class="card__title" id="recap-driver">${icon('user')}<span>${t('flow.review.driver')}</span></h2>
        <a class="button button--link" href="#/driver">${icon('edit')}<span>${t('common.edit')}<span class="visually-hidden"> ${t('flow.review.driver')}</span></span></a>
      </div>
      <dl class="facts">
        ${row(t('flow.driver.birthDate'), formatDate(d.birth_date))}
        ${row(t('flow.driver.licenceSince'), formatDate(d.licence_since))}
        ${row(t('flow.driver.claims'), d.claims_3y >= 3 ? t('flow.driver.claimsMore') : formatNumber(d.claims_3y))}
        ${row(t('flow.driver.km'), d.annual_km >= 30000 ? t('flow.driver.kmMore', { km: formatNumber(d.annual_km) }) : t('flow.driver.kmUpTo', { km: formatNumber(d.annual_km) }))}
        ${row(t('flow.driver.postcode'), d.postcode)}
        ${row(t('flow.driver.parking'), t(`flow.driver.parking.${d.parking}`))}
        ${row(t('flow.driver.charging'), t(`flow.driver.charging.${d.charging}`))}
      </dl>
    </section>

    <section class="card recap recap--cover" aria-labelledby="recap-cover">
      <div class="recap__head">
        <h2 class="card__title" id="recap-cover">${icon('shield')}<span>${t('flow.review.cover')}</span></h2>
        <a class="button button--link" href="#/cover">${icon('edit')}<span>${t('common.edit')}<span class="visually-hidden"> ${t('flow.review.cover')}</span></span></a>
      </div>
      <dl class="facts facts--priced">
        ${row(
          html`${t('flow.review.package', { package: t(`package.${pkg.id}.name`) })}<span class="facts__sub">${t('flow.review.includes', { list: included.length ? included.join(', ') : t('option.MOTOR.name') })}</span>`,
          formatMoney(pkg.price[f]),
        )}
        ${options.map((code) => row(t(`option.${code}.name`), `+ ${formatMoney(pkg.options.find((o) => o.code === code).price[f])}`))}
      </dl>
      <div class="recap__total">
        <span>${t(f === 'monthly' ? 'flow.review.totalMonthly' : 'flow.review.totalAnnual')}</span>
        <strong>${formatMoney(total())}</strong>
      </div>
    </section>`;
}

function documents() {
  return html`
    <section class="card" aria-labelledby="docs-title">
      <h2 class="card__title" id="docs-title">${icon('document')}<span>${t('flow.review.documents.title')}</span></h2>
      <p class="card__text">${t('flow.review.documents.lead')}</p>
      <ul class="documents">
        ${DOCUMENTS.map(
          (doc) => html`
            <li>
              <a class="document-link" href="#/review" data-doc="${doc}">
                ${icon('document')}
                <span class="document-link__text">
                  <span class="document-link__name">${t(`document.${doc}.name`)}</span>
                  <span class="document-link__meta">${t(`document.${doc}.meta`)}</span>
                </span>
              </a>
            </li>`,
        )}
      </ul>
    </section>`;
}

export default {
  id: 'review',

  render(root, ctx) {
    const h = state.holder;
    const c = state.contract;
    const busy = c.status === 'loading';
    const showProblem = c.status === 'error' && c.problem !== 'consent';

    render(
      root,
      html`
        <form class="container container--narrow step" novalidate>
          ${stepHeader({ eyebrow: t('flow.review.eyebrow'), title: t('flow.review.title'), lead: t('flow.review.lead') })}

          ${showProblem
            ? problemPanel({
                kind: c.problem,
                context: 'contract',
                actions:
                  c.problem === 'expired'
                    ? [{ id: 'requote', label: t('problem.action.requote'), primary: true }]
                    : c.problem === 'invalid'
                      ? [{ href: '#/driver', label: t('problem.action.editAnswers'), primary: true }]
                      : [{ id: 'retry', label: t('problem.action.retry'), primary: true }],
              })
            : ''}

          ${recap()}

          <fieldset class="card stack" ${busy ? 'disabled' : ''}>
            <legend class="card__title card__title--legend">${icon('user')}<span>${t('flow.review.holder')}</span></legend>
            <p class="card__text">${t('flow.review.holderLead')}</p>
            <div class="grid-2">
              ${textField({ id: 'first_name', label: t('flow.review.firstName'), autocomplete: 'given-name', value: h.first_name, error: errors.first_name && t(errors.first_name) })}
              ${textField({ id: 'last_name', label: t('flow.review.lastName'), autocomplete: 'family-name', value: h.last_name, error: errors.last_name && t(errors.last_name) })}
            </div>
            ${textField({ id: 'email', label: t('flow.review.email'), hint: t('flow.review.emailHint'), type: 'email', autocomplete: 'email', value: h.email, error: errors.email && t(errors.email) })}
            ${textField({ id: 'phone', label: t('flow.review.phone'), type: 'tel', autocomplete: 'tel', value: h.phone, error: errors.phone && t(errors.phone) })}
          </fieldset>

          ${documents()}

          <fieldset class="card stack" ${busy ? 'disabled' : ''}>
            <legend class="card__title card__title--legend">${icon('check')}<span>${t('flow.review.consents')}</span></legend>
            ${CONSENTS.map((key) => checkbox({ id: key, label: t(`consent.${key}`), checked: state.consents[key], error: errors[key] && t(errors[key]) }))}
          </fieldset>

          <p class="inline-note">${icon('info')}<span>${t('flow.review.noCharge')}</span></p>

          ${actions({ back: 'cover', primaryLabel: t('flow.review.submit'), busy, busyLabel: t('flow.review.submitting') })}
        </form>`,
    );

    const form = root.querySelector('form');

    form.addEventListener('input', (e) => {
      const { name, value, checked, type } = e.target;
      if (type === 'checkbox' && name in state.consents) state.consents[name] = checked;
      else if (name in h) h[name] = value;
    });
    // On `input`, not `change`: see the driver screen (a blur-time layout shift swallows the next click).
    form.addEventListener('input', (e) => {
      const { name } = e.target;
      if (!submitted || !errors[name]) return;
      validate();
      if (!errors[name]) clearError(form, name);
    });

    // The documents are placeholders: links "do not need to go anywhere".
    form.addEventListener('click', (e) => {
      if (e.target.closest('[data-doc]')) e.preventDefault();
    });

    root.querySelector('#requote')?.addEventListener('click', () => {
      // A fresh quote for the same answers. Same answers = same key, so the
      // cover screen keeps the customer's package and add-ons.
      state.quote.status = 'idle';
      state.contract = { status: 'idle', data: null, problem: null };
      ctx.go('cover');
    });
    root.querySelector('#retry')?.addEventListener('click', () => form.requestSubmit());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (state.contract.status === 'loading') return;
      submitted = true;
      if (!validate()) return ctx.rerender(null, focusFirstError);

      state.contract = { status: 'loading', data: null, problem: null };
      ctx.rerender('#continue');

      const result = await api.createContract({
        quote_id: state.quote.data.quote_id,
        package_id: state.selection.packageId,
        options: chosenOptionCodes(),
        frequency: state.selection.frequency,
        holder: {
          first_name: h.first_name.trim(),
          last_name: h.last_name.trim(),
          email: h.email.trim(),
          phone: normalisePhone(h.phone),
        },
        consents: { ...state.consents },
      });

      if (result.ok) {
        state.contract = { status: 'issued', data: result.data, problem: null };
        ctx.complete('review');
        ctx.go('payment');
        return;
      }
      state.contract = { status: 'error', data: null, problem: result.problem };
      if (result.problem === 'consent') {
        // Should not happen (we check first), but if the carrier disagrees, point at the boxes.
        for (const key of CONSENTS) if (!state.consents[key]) errors[key] = 'flow.review.error.consent';
        return ctx.rerender(null, focusFirstError);
      }
      ctx.rerender('#problem-title');
    });
  },

  reset() {
    errors = {};
    submitted = false;
  },
};
