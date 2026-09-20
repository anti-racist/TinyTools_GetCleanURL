# Get Clean URL

A Chrome extension that strips tracking parameters off a link and puts the clean
version on your clipboard — one tab, or every open tab at once.

## What it does

Click the extension icon: the current page's link is cleaned and copied.

Press **Copy all open tabs**: every tab in every window is cleaned, duplicates
merged, one link per line.

Removed everywhere: `utm_*`, `fbclid`, `gclid`, `mc_eid` and 38 more, plus the
`fb_`, `pk_`, `mtm_` and `hsa_` families. Kept: anything that changes what the
page shows, and `ref`, `referrer`, `source`, which mean something real on plenty
of sites. Three sites have their own rules — Amazon (affiliate and session
parameters; product links collapsed to `/dp/<ASIN>`), YouTube (`si`) and Bing
(`cvid`, `FORM`).

On pages it cannot read — `chrome://`, the extension gallery, a blank new tab —
it does nothing and leaves the clipboard alone.

## Permissions

| Permission | For |
| --- | --- |
| `activeTab` | the URL of the tab the popup was opened over |
| `clipboardWrite` | writing the cleaned link |
| `tabs` *(optional)* | the URLs of your other tabs, for **Copy all open tabs** |

Chrome asks for `tabs` the first time you press the button. Decline and
single-tab copying still works. Tab titles are never read.

## Install

`chrome://extensions` → **Developer mode** → **Load unpacked** → this folder.

## Development

```
npm test        # unit tests
npm run diff    # cleaner against the committed v1.4 baseline
npm run verify  # both
```

`tests/corpus.js` generates close to 700 URLs and `tests/golden-v1.4.json` records
what v1.4 did with each one. Any difference not listed in `tests/allowlist.json`
fails the run; intended ones go in the allowlist with a reason. `npm run snapshot`
rebuilds the baseline.

`tests.html` runs the cleaner checks in a browser.

`src/rules.js` parameter lists and per-site rules, `src/cleaner.js` the cleaning,
`src/batch.js` the multi-tab list, `src/browser.js` the Chrome APIs, `src/ui.js`
every word the popup says.

## Privacy

No data collected, no network access.

## Compatibility

Chrome, Edge, Vivaldi.

## What is new in 2.0

- Copy every open tab at once, cleaned and de-duplicated.
- Opening the extension on a new tab or a settings page no longer replaces your
  clipboard.
- Parameter counts are right on Amazon product links.
- Many more tracking parameters recognised, including ones in capital letters.
- Redesigned popup: clearer wording, visible focus ring, WCAG 2.2 AA contrast.
- Rules are organised site by site.
