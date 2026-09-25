# Get Clean URL

A Chrome extension that strips tracking parameters off a link and puts the clean
version on your clipboard — one tab, or every open tab at once.

## What it does

Click the extension icon: the current page's link is cleaned and copied.

Press **Copy all open tabs**: every tab in every window is cleaned, duplicates
merged, one link per line.

Removed everywhere: `utm_*`, `fbclid`, `gclid`, `mc_eid` and 45 more, plus the
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

We do not collect any user data. Nothing you type is ever sent to us.

Full details: [privacy policy](PRIVACY.md).

## Compatibility

Compatible with most Chromium-based browsers, including Google Chrome, Microsoft Edge and Vivaldi.

## What is new in 2.2

- More trackers removed: Google's cross-domain `_gl` and Google Ads'
  `gad_campaignid`, HubSpot's `__hstc`, `__hssc` and `__hsfp`, and
  MailerLite's `ml_subscriber` and `ml_subscriber_hash`.
- Reddit: the `share_id` its Share button adds is removed.
