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
of sites. Four sites have their own rules — Amazon (affiliate and session
parameters; product links collapsed to `/dp/<ASIN>`), YouTube (`si`), Bing
(`cvid`, `FORM`) and Google Search (`ved`, `ei`, `oq`, `gs_*` and other session
and telemetry values, on results pages only).

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

## Source layout

`src/rules.js` parameter lists and per-site rules, `src/cleaner.js` the cleaning,
`src/batch.js` the multi-tab list, `src/browser.js` the Chrome APIs, `src/ui.js`
every word the popup says.

This repository holds the extension itself. The test suite and the golden
baseline it is checked against are kept outside it.

## Privacy

No data collected, no network access.

## Compatibility

Chrome, Edge, Vivaldi.

## What is new in 2.0.1

- Parameters that are kept now stay exactly as they were. Removing a tracker
  used to re-encode the rest of the link, which garbled non-UTF-8 search terms
  (Baidu) and broke `#!/` page routes.
- Google Search results pages: session and telemetry parameters removed,
  including AI Mode's `mstk`, `csuir` and `mtid`. Other Google services are
  left alone.
- A username and password in a link (`user:pass@`) are removed before copying.
- Amazon Turkey (`amazon.com.tr`), Belgium and Egypt recognised; so are
  addresses written with a trailing dot.
- Vivaldi: with several windows open, the tab copied is the one in the window
  you clicked in, never another window's.
- Declining the tabs permission no longer blanks a result the popup had
  already copied.

## What is new in 2.0

- Copy every open tab at once, cleaned and de-duplicated.
- Opening the extension on a new tab or a settings page no longer replaces your
  clipboard.
- Parameter counts are right on Amazon product links.
- Many more tracking parameters recognised, including ones in capital letters.
- Redesigned popup: clearer wording, visible focus ring, WCAG 2.2 AA contrast.
- Rules are organised site by site.
