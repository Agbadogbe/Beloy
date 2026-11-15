# BMW electric vehicle cover, enrollment flow

**Try it online:** https://agbadogbe.github.io/Beloy/ (add `?demo=1` to prefill the forms).
That copy runs on GitHub Pages with the in-browser stub of the API (see below), so
nothing needs installing, on a phone or a desktop.

## Run it locally

```
node server.js
```

Then open http://127.0.0.1:4000. Node 18 or newer, no `npm install`, no dependencies.

That one command serves the front end **and** a mock of the Ardenne Assurance API
(`POST /v1/quotes`, `POST /v1/contracts`) on the documented base URL.

No Node? Any static server works too (`python3 -m http.server 4000`): when the API
does not answer, the front end falls back to an in-browser stub of the same contract
and says so in the console.

To open it from a phone on the same Wi-Fi, listen on every interface:
`HOST=0.0.0.0 node server.js`, then open `http://<your-computer's-ip>:4000`.
Some school or office networks block devices from reaching each other; use the
online copy then.

## Useful URLs for the walkthrough

They work locally and online, e.g. https://agbadogbe.github.io/Beloy/?demo=1&simulate=expired.

| URL | What it shows |
| --- | --- |
| `/?demo=1` | Forms prefilled with the API document's test driver |
| `/?lang=en` | English copy (or use the EN / FR button) |
| `/?latency=2000` | Slow API, to look at the wait states |
| `/?demo=1&simulate=server_error` | Every call fails with 500 (retried once, then explained) |
| `/?demo=1&simulate=expired` | Issuing the contract fails with 409 quote expired |
| 3 claims, or a licence under 2 years | The carrier's 422 refusal, explained |

## Behaviour worth knowing

- **Phone first.** Checked in Chrome's device emulation from 320 px wide to desktop,
  portrait and landscape, light and dark, French and English: no horizontal scroll, form fields at 16 px (no zoom on
  iPhone), and 44 px touch targets on touch screens.
- **Dates of birth and licence** are day / month / year selects, newest years first,
  so 1994 is two taps away. The delivery date keeps the native calendar and starts
  tomorrow, as the API requires.
- **After the policy is issued, earlier steps are locked.** Going back and submitting
  again would issue a second contract. The payment screen says so and offers
  "Start a new quote", which asks first (the reference is not shown again) and then
  clears every answer.
- **State lives in memory.** A reload starts again, as the brief allows.
- **Errors never show codes.** Codes, messages and request ids go to the console;
  the customer gets a sentence and a way forward.

## Checks

```
node scripts/check.js
```

Checks the house rules: same keys in `fr.js` and `en.js`, every key used exists,
no colour literal outside `tokens.css`, no price built outside `format.js`, and
the worked total from the API document (comfort + WALLBOX + BATTERY + GLASS =
816,00 € / 74,80 €).

## Structure

```
index.html              shell: header, stepper, main, footer
server.js               static files + mock API, Node built-ins only
styles/
  tokens.css            THE place for colour and size (primitives -> light / dark semantic tokens)
  base.css              reset, type, layout helpers
  components.css        buttons, fields, cards, stepper, problem panel, skeleton...
  screens.css           layout of each screen
  print.css             payment reference print / save as PDF
src/
  app.js                hash router, step guards, focus management, theme + language switch
  config.js             API base URL (one place), demo / simulation flags
  store.js              in-memory state, running total, options to send
  i18n.js, i18n/fr.js, i18n/en.js    copy by key
  format.js             the only money / date / number formatter
  html.js               escaping template helper
  api/contract.js       the API contract, pure functions, shared by server.js and the stub
  api/client.js         the only module that calls the API; maps error codes to "problems"
  api/stub.js           in-browser stand-in for the API
  components/           icons, fields, layout pieces, stepper
  screens/              landing, vehicle, driver, cover, review, payment
scripts/check.js        house-rule checks
```

To rebrand: change `styles/tokens.css`, the font `<link>` in `index.html`, the
stand-in mark in `src/components/icons.js`, and the brand strings in the copy files.
