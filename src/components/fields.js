/*
  Form building blocks. Each returns markup; the screen wires the events.
  Every field: visible label, optional hint, error slot linked with
  aria-describedby, so screen readers hear the hint and the error.
*/

import { html } from '../html.js';
import { icon } from './icons.js';

const describedBy = (id, hint) => [hint ? `${id}-hint` : '', `${id}-error`].filter(Boolean).join(' ');

export function textField({ id, label, hint, value = '', type = 'text', autocomplete, inputmode, error, max, min, required = true }) {
  return html`
    <div class="field ${error ? 'field--invalid' : ''}">
      <label class="field__label" for="${id}">${label}</label>
      ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
      <input class="input" id="${id}" name="${id}" type="${type}" value="${value ?? ''}"
        ${autocomplete ? html`autocomplete="${autocomplete}"` : ''}
        ${inputmode ? html`inputmode="${inputmode}"` : ''}
        ${max ? html`max="${max}"` : ''} ${min ? html`min="${min}"` : ''}
        ${required ? 'required' : ''}
        aria-describedby="${describedBy(id, hint)}" ${error ? 'aria-invalid="true"' : ''}>
      <p class="field__error" id="${id}-error">${error ? html`${icon('alert')}<span>${error}</span>` : ''}</p>
    </div>`;
}

export function selectField({ id, label, hint, value, options, error }) {
  return html`
    <div class="field ${error ? 'field--invalid' : ''}">
      <label class="field__label" for="${id}">${label}</label>
      ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
      <div class="select">
        <select class="input" id="${id}" name="${id}" aria-describedby="${describedBy(id, hint)}" ${error ? 'aria-invalid="true"' : ''}>
          ${options.map((o) => html`<option value="${o.value}" ${String(o.value) === String(value) ? 'selected' : ''}>${o.label}</option>`)}
        </select>
      </div>
      <p class="field__error" id="${id}-error">${error ? html`${icon('alert')}<span>${error}</span>` : ''}</p>
    </div>`;
}

/*
  A group of native radios, styled as chips or as cards with an icon.
  Native radios give arrow-key navigation and screen reader semantics for free.
*/
export function choiceGroup({ name, legend, hint, value, options, error, variant = 'chips' }) {
  return html`
    <fieldset class="field choice ${error ? 'field--invalid' : ''}" aria-describedby="${describedBy(name, hint)}">
      <legend class="field__label">${legend}</legend>
      ${hint ? html`<p class="field__hint" id="${name}-hint">${hint}</p>` : ''}
      <div class="choice__list choice__list--${variant}">
        ${options.map(
          (o) => html`
            <label class="choice__item choice__item--${variant}">
              <input type="radio" name="${name}" value="${o.value}" ${String(o.value) === String(value) ? 'checked' : ''}>
              <span class="choice__box">
                ${o.icon ? html`<span class="choice__icon">${icon(o.icon)}</span>` : ''}
                <span class="choice__text">
                  <span class="choice__label">${o.label}</span>
                  ${o.detail ? html`<span class="choice__detail">${o.detail}</span>` : ''}
                </span>
              </span>
            </label>`,
        )}
      </div>
      <p class="field__error" id="${name}-error">${error ? html`${icon('alert')}<span>${error}</span>` : ''}</p>
    </fieldset>`;
}

export function checkbox({ id, label, checked, error, detail }) {
  return html`
    <div class="field checkbox ${error ? 'field--invalid' : ''}">
      <label class="checkbox__label" for="${id}">
        <input type="checkbox" id="${id}" name="${id}" ${checked ? 'checked' : ''}
          aria-describedby="${id}-error" ${error ? 'aria-invalid="true"' : ''}>
        <span class="checkbox__box" aria-hidden="true">${icon('check')}</span>
        <span class="checkbox__text">${label}${detail ? html`<span class="checkbox__detail">${detail}</span>` : ''}</span>
      </label>
      <p class="field__error" id="${id}-error">${error ? html`${icon('alert')}<span>${error}</span>` : ''}</p>
    </div>`;
}

/* Moves focus to the first invalid field, after a failed submit. */
export function focusFirstError(root) {
  const first = root.querySelector('[aria-invalid="true"], .field--invalid input');
  first?.focus();
}

/*
  Clear one field's error in place, without re-rendering the form.
  Re-rendering on `change` would replace the button the customer is about
  to click (change fires on blur, i.e. on the way to that click), and the
  click would land on a detached element and be lost.
*/
export function clearError(root, name) {
  const message = root.querySelector(`#${name}-error`);
  if (!message) return;
  message.textContent = '';
  message.closest('.field')?.classList.remove('field--invalid');
  root.querySelectorAll(`[name="${name}"]`).forEach((el) => el.removeAttribute('aria-invalid'));
}
