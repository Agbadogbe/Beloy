/*
  Progress through the five steps after the landing page.
  Desktop: labelled steps. Phone: "Step 2 of 5 · Driver" and a thin bar,
  because five labels do not fit 360px.
*/

import { html } from '../html.js';
import { t } from '../i18n.js';
import { icon } from './icons.js';

export function stepper({ steps, current, completed }) {
  const index = steps.indexOf(current);
  const progress = (index + 1) / steps.length;
  return html`
    <nav class="stepper" aria-label="${t('stepper.label')}">
      <p class="stepper__compact">
        <span>${t('stepper.count', { current: index + 1, total: steps.length })}</span>
        <span class="stepper__compact-name">${t(`stepper.${current}`)}</span>
      </p>
      <div class="stepper__bar" aria-hidden="true"><span style="--progress: ${progress}"></span></div>
      <ol class="stepper__list">
        ${steps.map((step, i) => {
          const state = step === current ? 'current' : completed.has(step) ? 'done' : 'todo';
          return html`
            <li class="stepper__item stepper__item--${state}" ${state === 'current' ? 'aria-current="step"' : ''}>
              <span class="stepper__dot">${state === 'done' ? icon('check') : i + 1}</span>
              <span class="stepper__name">${t(`stepper.${step}`)}</span>
              ${state === 'done' ? html`<span class="visually-hidden">${t('stepper.done')}</span>` : ''}
            </li>`;
        })}
      </ol>
    </nav>`;
}
