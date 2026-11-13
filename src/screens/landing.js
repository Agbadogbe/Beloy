/*
  Step 0, landing. One job: make someone want to continue.
  Dark hero like bmw.fr's, the "from" price (marketing copy, from the copy
  file, still formatted by formatMoney), what is covered, one way in.
*/

import { html, render } from '../html.js';
import { t, copyValue } from '../i18n.js';
import { formatMoney, formatDate } from '../format.js';
import { icon, OPTION_ICONS } from '../components/icons.js';
import { state } from '../store.js';

const COVERS = ['MOTOR', 'WALLBOX', 'CABLE', 'BATTERY', 'GLASS', 'STRANDED'];

export default {
  id: 'landing',

  render(root) {
    const model = t(`vehicle.model.${state.vehicle.model_code}`);
    render(
      root,
      html`
        <section class="hero">
          <div class="hero__inner">
            <p class="eyebrow eyebrow--hero">${t('landing.eyebrow')} <span class="eyebrow__model">${model}</span></p>
            <h1 class="hero__title" tabindex="-1" data-autofocus>${t('landing.title')}</h1>
            <p class="hero__lead">${t('landing.lead', { date: formatDate(state.vehicle.delivery_date) })}</p>
            <p class="hero__price">
              <span class="hero__price-from">${t('landing.from')}</span>
              <span class="hero__price-figure">${formatMoney(copyValue('marketing.fromMonthly'))}</span>
              <span class="hero__price-per">${t('common.perMonth')}</span>
            </p>
            <div class="hero__actions">
              <a class="button button--primary button--large" href="#/vehicle">
                <span>${t('landing.cta')}</span>${icon('arrowRight')}
              </a>
              <p class="hero__note">${t('landing.duration')}</p>
            </div>
          </div>
        </section>

        <section class="container section" aria-labelledby="covers-title">
          <h2 class="section__title" id="covers-title">${t('landing.covers.title')}</h2>
          <p class="section__lead">${t('landing.covers.lead')}</p>
          <ul class="cover-grid">
            ${COVERS.map(
              (code) => html`
                <li class="cover-tile">
                  <span class="cover-tile__icon">${icon(code === 'MOTOR' ? 'car' : OPTION_ICONS[code])}</span>
                  <h3 class="cover-tile__title">${t(`option.${code}.name`)}</h3>
                  <p class="cover-tile__text">${t(`option.${code}.description`)}</p>
                </li>`,
            )}
          </ul>
        </section>

        <section class="container section section--split" aria-labelledby="how-title">
          <h2 class="section__title" id="how-title">${t('landing.how.title')}</h2>
          <ol class="how-list">
            ${[1, 2, 3].map(
              (n) => html`
                <li class="how-list__item">
                  <span class="how-list__number">${n}</span>
                  <div>
                    <h3 class="how-list__title">${t(`landing.how.${n}.title`)}</h3>
                    <p class="how-list__text">${t(`landing.how.${n}.text`)}</p>
                  </div>
                </li>`,
            )}
          </ol>
          <a class="button button--secondary" href="#/vehicle">${t('landing.cta')}</a>
        </section>`,
    );
  },
};
