# BMW electric vehicle cover, enrollment flow

```
node server.js
```

Then open http://127.0.0.1:4000. Node 18 or newer, no `npm install`, no dependencies.

That one command serves the front end **and** a mock of the Ardenne Assurance API
(`POST /v1/quotes`, `POST /v1/contracts`) on the documented base URL.

No Node? Any static server works too (`python3 -m http.server 4000`): when the API
does not answer, the front end falls back to an in-browser stub of the same contract
and says so in the console.

## Useful URLs for the walkthrough

| URL | What it shows |
| --- | --- |
| `/?demo=1` | Forms prefilled with the API document's test driver |
| `/?lang=en` | English copy (or use the EN / FR button) |
| `/?latency=2000` | Slow API, to look at the wait states |
| `/?demo=1&simulate=server_error` | Every call fails with 500 (retried once, then explained) |
| `/?demo=1&simulate=expired` | Issuing the contract fails with 409 quote expired |
| 3 claims, or a licence under 2 years | The carrier's 422 refusal, explained |

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
