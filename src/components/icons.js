/*
  Inline SVG icons, 24x24, stroke = currentColor, so every icon takes its
  colour from the token of the text around it. Line style matches bmw.fr's
  thin outline icons in the header.
*/

import { raw } from '../html.js';

const svg = (body, label) =>
  raw(
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${
      label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"'
    }>${body}</svg>`,
  );

const paths = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  car: '<path d="M3 15v-3l2-5h14l2 5v3"/><path d="M3 15h18v3H3z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/><path d="M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  wallbox: '<rect x="6" y="3" width="12" height="13" rx="1.5"/><path d="M12 6.5l-2 3.5h4l-2 3.5"/><path d="M12 16v2a3 3 0 0 0 3 3h3"/>',
  cable: '<path d="M7 3v4M11 3v4"/><path d="M5 7h8v3a4 4 0 0 1-8 0V7z"/><path d="M9 14v2a5 5 0 0 0 5 5h5"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="1.5"/><path d="M21 10.5v3"/><path d="M6.5 10v4M10 10v4"/>',
  stranded: '<path d="M3 16v-3l2-5h9l2 5v3H3z"/><circle cx="6.5" cy="17" r="1.5"/><circle cx="13" cy="17" r="1.5"/><path d="M16 13h3l2 3v1h-5"/><path d="M19 4l-2 3h3l-2 3"/>',
  glass: '<path d="M4 17C5 10 8 6 12 6s7 4 8 11H4z"/><path d="M9 9l-2 4M13 8.5l-3 5"/>',
  home: '<path d="M4 11l8-7 8 7v9H4v-9z"/><path d="M10 20v-5h4v5"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M9 7V5h6v2M3 12h18"/>',
  station: '<rect x="4" y="3" width="10" height="18" rx="1.5"/><path d="M4 9h10"/><path d="M14 11h2a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0V8l-2-2"/><path d="M9 12l-1.5 2.5h3L9 17"/>',
  garage: '<path d="M3 10l9-6 9 6v10H3V10z"/><path d="M7 20v-7h10v7M7 16h10"/>',
  driveway: '<path d="M3 11l6-5 6 5v9H3v-9z"/><path d="M15 20h6M17 20l1.5-9h1"/>',
  street: '<path d="M8 3L5 21M16 3l3 18"/><path d="M12 4v3M12 10.5v3M12 17v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>',
  document: '<path d="M6 3h8l4 4v14H6V3z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  alert: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bank: '<path d="M3 9l9-5 9 5H3z"/><path d="M5 9v8M10 9v8M14 9v8M19 9v8M3 20h18"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M11 18.5h2"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  bolt: '<path d="M13 2L5 13.5h6L10 22l8-11.5h-6L13 2z"/>',
};

export const icon = (name, label) => svg(paths[name], label);

/* The option codes from the API, mapped to their icon. */
export const OPTION_ICONS = { WALLBOX: 'wallbox', CABLE: 'cable', BATTERY: 'battery', STRANDED: 'stranded', GLASS: 'glass' };

export const spinner = () =>
  raw('<span class="spinner" aria-hidden="true"></span>');

/*
  Stand-in mark: NOT the BMW roundel (the brief forbids shipping it).
  A ring split by a single lightning stroke: says "electric", keeps the
  circular silhouette people expect in the top left of a BMW page.
*/
export const logoMark = () =>
  raw(`<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="20" cy="20" r="12.5" fill="none" stroke="currentColor" stroke-width="1"/>
    <path d="M22.5 9.5 15 21.5h5.5L17.5 30.5 25 18.5h-5.5z" fill="currentColor"/>
  </svg>`);
