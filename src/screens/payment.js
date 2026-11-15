/*
  Step 5, payment reference. Nothing is charged here.
  One job: hand over entity + reference + amount so they survive being
  copied down or read off a phone in a car park.

  - Big, high-contrast digits, reference grouped 3-3-3 (copy gives the raw digits).
  - Each value has its own copy button, plus "copy all three".
  - Print / save as PDF with a print stylesheet that keeps only this card.
  - The contract is issued, so earlier steps are locked (no second contract
    by going back and submitting again). The screen says so, and offers a
    fresh quote, after a confirm, since the reference is not shown again.
*/

import { html, render } from '../html.js';
import { t } from '../i18n.js';
import { formatMoney, formatDate, groupDigits } from '../format.js';
import { icon } from '../components/icons.js';
import { state } from '../store.js';

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.warn('[payment] clipboard unavailable', err);
    return false;
  }
}

function valueRow({ key, label, display, copyText }) {
  return html`
    <div class="reference__row">
      <dt class="reference__label">${label}</dt>
      <dd class="reference__value">
        <span class="reference__digits" id="ref-${key}">${display}</span>
        <button class="button button--icon" type="button" data-copy="${copyText}" data-copied="${t('flow.payment.copied')}"
          aria-label="${t('flow.payment.copyOne', { label })}">
          ${icon('copy')}<span class="button__label">${t('flow.payment.copy')}</span>
        </button>
      </dd>
    </div>`;
}

export default {
  id: 'payment',

  render(root, ctx) {
    const c = state.contract.data;
    const p = c.payment;
    const monthly = c.premium.frequency === 'monthly';
    const amount = formatMoney(p.amount);
    const allText = t('flow.payment.copyAllText', { entity: p.entity, reference: p.reference, amount });

    render(
      root,
      html`
        <div class="container container--narrow step payment">
          <header class="step-header payment__header">
            <span class="payment__success">${icon('check')}</span>
            <p class="eyebrow">${t('flow.payment.eyebrow')}</p>
            <h1 class="step-header__title" tabindex="-1" data-autofocus>${t('flow.payment.title')}</h1>
            <p class="step-header__lead">${t('flow.payment.lead', { name: state.holder.first_name.trim() })}</p>
          </header>

          <section class="reference" aria-labelledby="reference-title">
            <div class="reference__head">
              <h2 class="reference__title" id="reference-title">${icon('bank')}<span>${t('flow.payment.referenceTitle')}</span></h2>
              <p class="reference__due">${icon('calendar')}<span>${t('flow.payment.dueBy', { date: formatDate(p.due_by) })}</span></p>
            </div>
            <dl class="reference__list">
              ${valueRow({ key: 'entity', label: t('flow.payment.entity'), display: p.entity, copyText: p.entity })}
              ${valueRow({ key: 'reference', label: t('flow.payment.reference'), display: groupDigits(p.reference), copyText: p.reference })}
              ${valueRow({ key: 'amount', label: t('flow.payment.amount'), display: amount, copyText: (p.amount / 100).toFixed(2) })}
            </dl>
            ${monthly ? html`<p class="reference__note">${t('flow.payment.firstInstalment')}</p>` : ''}
            <div class="reference__actions">
              <button class="button button--primary" type="button" data-copy="${allText}" data-copied="${t('flow.payment.copiedAll')}">
                ${icon('copy')}<span class="button__label">${t('flow.payment.copyAll')}</span>
              </button>
              <button class="button button--secondary" type="button" id="print">${icon('print')}<span>${t('flow.payment.print')}</span></button>
            </div>
            <p class="visually-hidden" aria-live="polite" id="copy-status"></p>
          </section>

          <section class="card" aria-labelledby="next-title">
            <h2 class="card__title" id="next-title">${t('flow.payment.nextTitle')}</h2>
            <ol class="how-list how-list--compact">
              ${[1, 2, 3].map(
                (n) => html`
                  <li class="how-list__item">
                    <span class="how-list__number">${n}</span>
                    <div>
                      <h3 class="how-list__title">${t(`flow.payment.next.${n}.title`)}</h3>
                      <p class="how-list__text">${t(`flow.payment.next.${n}.text`, { date: formatDate(p.due_by), start: formatDate(c.starts_on) })}</p>
                    </div>
                  </li>`,
              )}
            </ol>
          </section>

          <section class="card" aria-labelledby="policy-title">
            <h2 class="card__title" id="policy-title">${icon('shield')}<span>${t('flow.payment.policyTitle')}</span></h2>
            <dl class="facts">
              <div class="facts__row"><dt>${t('flow.payment.policyNumber')}</dt><dd class="mono">${c.policy_number}</dd></div>
              <div class="facts__row"><dt>${t('flow.payment.period')}</dt><dd>${t('flow.payment.periodValue', { start: formatDate(c.starts_on), end: formatDate(c.ends_on) })}</dd></div>
              <div class="facts__row"><dt>${t(monthly ? 'flow.review.totalMonthly' : 'flow.review.totalAnnual')}</dt><dd>${formatMoney(c.premium[c.premium.frequency])}</dd></div>
            </dl>
            <p class="inline-note">${icon('info')}<span>${t('flow.payment.startsAfterPayment', { start: formatDate(c.starts_on) })}</span></p>
          </section>

          <footer class="payment__end">
            <p class="payment__locked">${t('flow.payment.locked')}</p>
            <button class="button button--secondary" type="button" id="start-over">${t('flow.payment.startOver')}</button>
          </footer>
        </div>`,
    );

    const status = root.querySelector('#copy-status');
    root.querySelector('.payment').addEventListener('click', async (e) => {
      const button = e.target.closest('[data-copy]');
      if (button) {
        const ok = await copy(button.dataset.copy);
        const label = button.querySelector('.button__label');
        // Remembered once, so a second click within 2s does not restore "Copied".
        button.dataset.label ??= label.textContent;
        clearTimeout(button.copyTimer);
        label.textContent = ok ? button.dataset.copied : t('flow.payment.copyFailed');
        button.querySelector('.icon').outerHTML = String(icon(ok ? 'check' : 'copy'));
        button.classList.toggle('is-copied', ok);
        status.textContent = label.textContent;
        button.copyTimer = setTimeout(() => {
          label.textContent = button.dataset.label;
          button.querySelector('.icon').outerHTML = String(icon('copy'));
          button.classList.remove('is-copied');
        }, 2000);
      }
      if (e.target.closest('#print')) window.print();
      if (e.target.closest('#start-over') && window.confirm(t('flow.payment.startOverConfirm'))) ctx.startOver();
    });
  },
};
