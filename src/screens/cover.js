/*
  Step 3, cover. The screen that earns the money.

  - Fetches the quote when it arrives here with answers it has not priced yet.
  - While pricing: skeleton cards of the same size as the real ones, so
    nothing jumps when the figures land.
  - Three packages as native radios, nothing selected on arrival.
  - Add-ons depend on the package: included ones are shown as included,
    the others carry the price the API returned for THAT package.
  - Yearly / monthly switch shows the API's figure for that frequency,
    never a division or multiplication of the other one.
  - Continue stays disabled until there is a price to continue with.
*/

import { html, render } from '../html.js';
import { t } from '../i18n.js';
import { formatMoney } from '../format.js';
import { icon, OPTION_ICONS, spinner } from '../components/icons.js';
import { stepHeader, problemPanel } from '../components/layout.js';
import { api } from '../api/client.js';
import { state, quoteRequest, quoteIsCurrent, selectPackage, toggleOption, selectedPackage, total, chosenOptionCodes, resetAfterQuote } from '../store.js';

const per = () => t(state.selection.frequency === 'monthly' ? 'common.perMonth' : 'common.perYear');

async function fetchQuote(ctx) {
  const key = JSON.stringify(quoteRequest());
  if (state.quote.requestKey !== key) resetAfterQuote();
  state.quote = { status: 'loading', data: null, problem: null, requestKey: key };
  ctx.rerender();

  const result = await api.createQuote(quoteRequest());
  // The customer may have gone back meanwhile; ignore answers to old questions.
  if (state.quote.requestKey !== key) return;
  state.quote = result.ok
    ? { status: 'ready', data: result.data, problem: null, requestKey: key }
    : { status: 'error', data: null, problem: result.problem, requestKey: key };
  ctx.rerender(result.ok ? null : '#problem-title');
}

/* ---------- pieces ---------- */

function frequencySwitch(disabled) {
  const f = state.selection.frequency;
  return html`
    <fieldset class="segmented" ${disabled ? 'disabled' : ''}>
      <legend class="visually-hidden">${t('flow.cover.frequency.label')}</legend>
      ${['monthly', 'annual'].map(
        (value) => html`
          <label class="segmented__item">
            <input type="radio" name="frequency" value="${value}" ${f === value ? 'checked' : ''}>
            <span>${t(`flow.cover.frequency.${value}`)}</span>
          </label>`,
      )}
    </fieldset>
    <p class="frequency-note">${t(`flow.cover.frequency.${f}Note`)}</p>`;
}

function packageCard(pkg) {
  const f = state.selection.frequency;
  const selected = state.selection.packageId === pkg.id;
  return html`
    <label class="package ${selected ? 'package--selected' : ''} ${pkg.id === 'comfort' ? 'package--featured' : ''}">
      <input class="package__input" type="radio" name="package" value="${pkg.id}" ${selected ? 'checked' : ''}
        aria-describedby="pkg-${pkg.id}-price pkg-${pkg.id}-list">
      ${pkg.id === 'comfort' ? html`<span class="badge package__badge">${t('flow.cover.popular')}</span>` : ''}
      <span class="package__head">
        <span class="package__name">${t(`package.${pkg.id}.name`)}</span>
        <span class="package__tagline">${t(`package.${pkg.id}.tagline`)}</span>
      </span>
      <span class="package__price" id="pkg-${pkg.id}-price">
        <span class="package__figure">${formatMoney(pkg.price[f])}</span>
        <span class="package__per">${per()}</span>
      </span>
      <span class="package__list" id="pkg-${pkg.id}-list">
        <span class="package__item package__item--included">${icon('check')}<span>${t('option.MOTOR.name')}</span></span>
        ${pkg.options.map(
          (o) => html`
            <span class="package__item ${o.included ? 'package__item--included' : 'package__item--extra'}">
              ${o.included ? icon('check') : html`<span class="package__plus" aria-hidden="true">+</span>`}
              <span>${t(`option.${o.code}.name`)}${o.included ? '' : html`<span class="visually-hidden"> ${t('flow.cover.asOption')}</span>`}</span>
            </span>`,
        )}
      </span>
      <span class="package__select" aria-hidden="true">
        <span class="package__radio">${icon('check')}</span>
        <span>${selected ? t('flow.cover.selected') : t('flow.cover.choose')}</span>
      </span>
    </label>`;
}

function skeletonCard() {
  return html`
    <div class="package package--skeleton" aria-hidden="true">
      <span class="skeleton skeleton--title"></span>
      <span class="skeleton skeleton--text"></span>
      <span class="skeleton skeleton--figure"></span>
      ${[1, 2, 3, 4, 5].map(() => html`<span class="skeleton skeleton--text"></span>`)}
    </div>`;
}

function addOns() {
  const pkg = selectedPackage();
  if (!pkg) {
    return html`
      <div class="empty-state">
        <span class="empty-state__icon">${icon('shield')}</span>
        <p class="empty-state__title">${t('flow.cover.addons.emptyTitle')}</p>
        <p class="empty-state__text">${t('flow.cover.addons.emptyText')}</p>
      </div>`;
  }
  const f = state.selection.frequency;
  return html`
    <ul class="addons">
      ${pkg.options.map((o) => {
        const id = `opt-${o.code}`;
        const checked = o.included || state.selection.options.has(o.code);
        return html`
          <li class="addon ${o.included ? 'addon--included' : ''} ${checked ? 'addon--on' : ''}">
            <label class="addon__label" for="${id}">
              <input type="checkbox" id="${id}" name="option" value="${o.code}" ${checked ? 'checked' : ''} ${o.included ? 'disabled' : ''}
                aria-describedby="${id}-desc ${id}-price">
              <span class="checkbox__box" aria-hidden="true">${icon('check')}</span>
              <span class="addon__icon">${icon(OPTION_ICONS[o.code])}</span>
              <span class="addon__text">
                <span class="addon__name">${t(`option.${o.code}.name`)}</span>
                <span class="addon__desc" id="${id}-desc">${t(`option.${o.code}.description`)}</span>
              </span>
              <span class="addon__price" id="${id}-price">
                ${o.included
                  ? html`<span class="badge badge--success">${t('flow.cover.included', { package: t(`package.${pkg.id}.name`) })}</span>`
                  : html`<span class="addon__figure">+ ${formatMoney(o.price[f])}</span><span class="addon__per">${per()}</span>`}
              </span>
            </label>
          </li>`;
      })}
    </ul>`;
}

function summaryBar(status) {
  const amount = total();
  const pkg = selectedPackage();
  const extras = chosenOptionCodes().length;
  let body;
  if (status === 'loading') {
    body = html`<span class="summary__loading">${spinner()}<span>${t('flow.cover.pricing')}</span></span>`;
  } else if (amount === null) {
    body = html`<span class="summary__label">${t('flow.cover.total')}</span><span class="summary__empty">${t('flow.cover.totalEmpty')}</span>`;
  } else {
    body = html`
      <span class="summary__label">${t('flow.cover.total')}</span>
      <span class="summary__figure">${formatMoney(amount)} <span class="summary__per">${per()}</span></span>
      <span class="summary__detail">${t(`package.${pkg.id}.name`)}${extras ? ` + ${t(extras === 1 ? 'flow.cover.oneOption' : 'flow.cover.nOptions', { n: extras })}` : ''}</span>`;
  }
  return html`
    <div class="summary" role="region" aria-label="${t('flow.cover.total')}">
      <div class="summary__inner container">
        <a class="button button--ghost summary__back" href="#/driver">${icon('arrowLeft')}<span class="summary__back-label">${t('common.back')}</span></a>
        <p class="summary__total" aria-live="polite" aria-atomic="true">${body}</p>
        <button class="button button--primary" type="submit" id="continue" ${amount === null ? 'disabled' : ''}>
          <span>${t('flow.cover.continue')}</span>${icon('arrowRight')}
        </button>
      </div>
    </div>`;
}

/* ---------- screen ---------- */

export default {
  id: 'cover',

  render(root, ctx) {
    if (!quoteIsCurrent() && state.quote.status !== 'loading' && !(state.quote.status === 'error' && state.quote.requestKey === JSON.stringify(quoteRequest()))) {
      fetchQuote(ctx);
      return;
    }

    const { status, data, problem } = state.quote;
    const header = stepHeader({ eyebrow: t('flow.cover.eyebrow'), title: t('flow.cover.title'), lead: t('flow.cover.lead') });

    if (status === 'error') {
      const fix = problem === 'ineligible' || problem === 'invalid';
      render(
        root,
        html`
          <div class="container container--narrow step">
            ${header}
            ${problemPanel({
              kind: problem,
              context: 'quote',
              actions: fix
                ? [{ href: '#/driver', label: t('problem.action.editAnswers'), primary: true }, { href: '#/', label: t('problem.action.home') }]
                : [{ id: 'retry', label: t('problem.action.retry'), primary: true }, { href: '#/driver', label: t('problem.action.editAnswers') }],
            })}
          </div>`,
      );
      root.querySelector('#retry')?.addEventListener('click', () => {
        state.quote.requestKey = null;
        fetchQuote(ctx);
      });
      return;
    }

    const loading = status === 'loading';
    render(
      root,
      html`
        <form class="step step--with-summary" novalidate aria-busy="${loading}">
          <div class="container">
            ${header}
            <div class="cover-toolbar">
              <h2 class="section__title section__title--sm" id="packages-title">${t('flow.cover.packagesTitle')}</h2>
              <div class="cover-toolbar__switch">${frequencySwitch(loading)}</div>
            </div>
            ${loading
              ? html`<div class="packages">${[1, 2, 3].map(skeletonCard)}</div>`
              : html`<div class="packages" role="radiogroup" aria-labelledby="packages-title">${data.packages.map(packageCard)}</div>`}

            <section class="addons-section" aria-labelledby="addons-title">
              <h2 class="section__title section__title--sm" id="addons-title">${t('flow.cover.addons.title')}</h2>
              <p class="section__lead">${t('flow.cover.addons.lead')}</p>
              ${loading ? html`<div class="empty-state empty-state--loading" aria-hidden="true"><span class="skeleton skeleton--text"></span></div>` : addOns()}
            </section>
          </div>
          ${summaryBar(status)}
        </form>`,
    );

    if (loading) return;
    const form = root.querySelector('form');

    form.addEventListener('change', (e) => {
      const { name, value, checked } = e.target;
      if (name === 'package') {
        selectPackage(value);
        ctx.rerender(`input[name="package"][value="${value}"]`);
      } else if (name === 'option') {
        toggleOption(value, checked);
        ctx.rerender(`#opt-${value}`);
      } else if (name === 'frequency') {
        state.selection.frequency = value;
        ctx.rerender(`input[name="frequency"][value="${value}"]`);
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (total() === null) return;
      ctx.complete('cover');
      ctx.go('review');
    });
  },
};
