/*
  Shared pieces every step screen uses, so the six screens read as one product:
  the step header (eyebrow + title + lead), the action row, and the problem
  panel that replaces any error code with words and a way forward.
*/

import { html } from '../html.js';
import { t } from '../i18n.js';
import { icon, spinner } from './icons.js';

export function stepHeader({ eyebrow, title, lead }) {
  return html`
    <header class="step-header">
      ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
      <h1 class="step-header__title" tabindex="-1" data-autofocus>${title}</h1>
      ${lead ? html`<p class="step-header__lead">${lead}</p>` : ''}
    </header>`;
}

/* Back + primary action. `busy` swaps the label but keeps the button's width. */
export function actions({ back, primaryLabel, primaryId = 'continue', disabled = false, busy = false, busyLabel }) {
  return html`
    <div class="actions">
      ${back ? html`<a class="button button--ghost" href="#/${back}">${icon('arrowLeft')}<span>${t('common.back')}</span></a>` : html`<span></span>`}
      <button class="button button--primary" id="${primaryId}" type="submit" ${disabled ? 'disabled' : ''} ${busy ? 'aria-disabled="true" aria-busy="true"' : ''}>
        ${busy ? html`${spinner()}<span>${busyLabel}</span>` : html`<span>${primaryLabel}</span>${icon('arrowRight')}`}
      </button>
    </div>`;
}

/*
  A failure, in the customer's words. `kind` is a key from api/client.js
  (ineligible, invalid, expired, unavailable, offline, consent).
  actions: [{ id, label, href?, primary? }]
*/
export function problemPanel({ kind, context, actions: buttons = [] }) {
  return html`
    <section class="problem" role="alert" aria-labelledby="problem-title">
      <span class="problem__icon">${icon(kind === 'ineligible' ? 'info' : 'alert')}</span>
      <div class="problem__body">
        <h2 class="problem__title" id="problem-title" tabindex="-1">${t(`problem.${context}.${kind}.title`)}</h2>
        <p class="problem__text">${t(`problem.${context}.${kind}.text`)}</p>
        <div class="problem__actions">
          ${buttons.map((b) =>
            b.href
              ? html`<a class="button ${b.primary ? 'button--primary' : 'button--secondary'}" href="${b.href}" ${b.id ? html`id="${b.id}"` : ''}>${b.label}</a>`
              : html`<button class="button ${b.primary ? 'button--primary' : 'button--secondary'}" type="button" id="${b.id}">${b.label}</button>`,
          )}
        </div>
      </div>
    </section>`;
}
