/*
  Tiny templating helper: html`<p>${value}</p>` returns a string where every
  interpolated value is HTML-escaped, so customer input can never inject
  markup. Nested html`` results and arrays of them are inserted as is.
*/

const SAFE = Symbol('safe');

const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function toHtml(value) {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(toHtml).join('');
  if (value[SAFE]) return value.value;
  return escape(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => {
    out += toHtml(value) + strings[i + 1];
  });
  return { [SAFE]: true, value: out, toString: () => out };
}

/** Mark a trusted string (e.g. an inline SVG from icons.js) as safe. */
export const raw = (value) => ({ [SAFE]: true, value: String(value), toString: () => String(value) });

export function render(root, template) {
  root.innerHTML = toHtml(template);
}
