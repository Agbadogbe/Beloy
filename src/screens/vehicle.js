/*
  Step 1, the vehicle. The order already tells us the car, so this is
  "confirm or correct", plus the delivery date the cover starts from.
*/

import { html, render } from '../html.js';
import { t } from '../i18n.js';
import { formatMoneyWhole, formatDate } from '../format.js';
import { icon } from '../components/icons.js';
import { stepHeader, actions } from '../components/layout.js';
import { textField, selectField, focusFirstError, clearError } from '../components/fields.js';
import { state } from '../store.js';
import { order } from '../data/order.js';
import { MODELS } from '../api/contract.js';

const todayIso = () => new Date().toISOString().slice(0, 10);
// Cover must start in the future (the API refuses today), so the picker starts tomorrow.
const tomorrowIso = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
let errors = {};

function validate() {
  const v = state.vehicle;
  errors = {};
  if (!v.delivery_date) errors.delivery_date = 'error.required';
  else if (v.delivery_date <= todayIso()) errors.delivery_date = 'flow.vehicle.error.deliveryPast';
  if (!Number.isInteger(v.list_price) || v.list_price <= 0) errors.list_price = 'flow.vehicle.error.price';
  return Object.keys(errors).length === 0;
}

function orderCard() {
  const v = state.vehicle;
  const fromOrder = v.model_code === order.model_code && v.list_price === order.list_price;
  return html`
    <article class="card order-card">
      <div class="order-card__head">
        <span class="order-card__icon">${icon('car')}</span>
        <div>
          <p class="order-card__ref">${t('flow.vehicle.orderRef', { reference: order.reference })}</p>
          <h2 class="order-card__model">${t(`vehicle.model.${v.model_code}`)}</h2>
          ${fromOrder ? html`<p class="order-card__variant">${t(`vehicle.variant.${order.variant}`)}</p>` : ''}
        </div>
      </div>
      <dl class="facts">
        ${fromOrder
          ? html`
              <div class="facts__row"><dt>${t('flow.vehicle.paint')}</dt><dd>${t(`vehicle.paint.${order.paint}`)}</dd></div>
              <div class="facts__row"><dt>${t('flow.vehicle.wheels')}</dt><dd>${t(`vehicle.wheels.${order.wheels}`)}</dd></div>`
          : html`<div class="facts__row"><dt>${t('flow.vehicle.configuration')}</dt><dd>${t('flow.vehicle.corrected')}</dd></div>`}
        <div class="facts__row"><dt>${t('flow.vehicle.listPrice')}</dt><dd>${formatMoneyWhole(v.list_price)}</dd></div>
      </dl>
      ${v.editing
        ? ''
        : html`<button class="button button--link" type="button" id="edit-vehicle" aria-expanded="false" aria-controls="vehicle-edit">
            ${icon('edit')}<span>${t('flow.vehicle.correct')}</span></button>`}
    </article>`;
}

function startsOnNote() {
  const v = state.vehicle;
  return v.delivery_date && !errors.delivery_date
    ? html`<p class="inline-note">${icon('shield')}<span>${t('flow.vehicle.startsOn', { date: formatDate(v.delivery_date) })}</span></p>`
    : '';
}

function editPanel() {
  const v = state.vehicle;
  return html`
    <div class="card card--subtle stack" id="vehicle-edit">
      <h2 class="card__title">${t('flow.vehicle.correctTitle')}</h2>
      ${selectField({
        id: 'model_code',
        label: t('flow.vehicle.model'),
        value: v.model_code,
        options: MODELS.map((m) => ({ value: m, label: t(`vehicle.model.${m}`) })),
      })}
      ${textField({
        id: 'list_price',
        label: t('flow.vehicle.listPriceInput'),
        hint: t('flow.vehicle.listPriceHint'),
        type: 'number',
        inputmode: 'numeric',
        min: '1',
        value: Number.isInteger(v.list_price) ? v.list_price / 100 : '',
        error: errors.list_price && t(errors.list_price),
      })}
      <button class="button button--link" type="button" id="done-edit">${icon('check')}<span>${t('flow.vehicle.doneEditing')}</span></button>
    </div>`;
}

export default {
  id: 'vehicle',

  render(root, ctx) {
    const v = state.vehicle;
    render(
      root,
      html`
        <form class="container container--narrow step" novalidate>
          ${stepHeader({ eyebrow: t('flow.vehicle.eyebrow'), title: t('flow.vehicle.title'), lead: t('flow.vehicle.lead') })}
          <div id="order-card">${orderCard()}</div>
          ${v.editing ? editPanel() : ''}
          <div class="card stack">
            ${textField({
              id: 'delivery_date',
              label: t('flow.vehicle.delivery'),
              hint: t('flow.vehicle.deliveryHint'),
              type: 'date',
              min: tomorrowIso(),
              value: v.delivery_date,
              error: errors.delivery_date && t(errors.delivery_date),
            })}
            <div id="starts-on" aria-live="polite">${startsOnNote()}</div>
          </div>
          ${actions({ back: 'landing', primaryLabel: t('flow.vehicle.confirm') })}
        </form>`,
    );

    const form = root.querySelector('form');

    form.addEventListener('input', (e) => {
      const { name, value } = e.target;
      if (name === 'delivery_date') v.delivery_date = value;
      if (name === 'list_price') v.list_price = value === '' ? null : Math.round(Number(value) * 100);
      if (name === 'model_code') v.model_code = value;
    });
    // Update only the parts that depend on the answer, in place: re-rendering
    // the whole form here would swallow a click on "Confirm" (see clearError).
    form.addEventListener('change', (e) => {
      if (e.target.name === 'model_code' || e.target.name === 'list_price') {
        render(form.querySelector('#order-card'), orderCard());
      }
      if (e.target.name === 'delivery_date') {
        validate();
        if (!errors.delivery_date) clearError(form, 'delivery_date');
        render(form.querySelector('#starts-on'), startsOnNote());
      }
    });

    root.querySelector('#edit-vehicle')?.addEventListener('click', () => {
      v.editing = true;
      ctx.rerender('#model_code');
    });
    root.querySelector('#done-edit')?.addEventListener('click', () => {
      if (!validate()) return ctx.rerender(null, focusFirstError);
      v.editing = false;
      ctx.rerender('#edit-vehicle');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) return ctx.rerender(null, focusFirstError);
      v.editing = false;
      ctx.complete('vehicle');
      ctx.go('driver');
    });
  },

  reset() {
    errors = {};
  },
};
