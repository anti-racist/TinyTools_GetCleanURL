# Auto Clean URL (experiment)

A separate, experimental extension that removes common tracking parameters automatically as pages open, with a switch that is off until it is turned on. It is not part of Get Clean URL and does not ship with it.

## What it removes

Every global name in Get Clean URL's rules, with the prefix families - `utm_`, `fb_`, `pk_`, `mtm_`, `hsa_`, `cm_mmc` - spelled out, since Chrome cannot match a prefix, and each name also in all lower and all upper case (573 in all). It is built from `src/rules.js`, so the two never drift apart. Site rules for LinkedIn, YouTube and Google search; other sites' rules stay with Get Clean URL's one click. Chrome matches names exactly, so a mixed spelling such as `Utm_Source`, and `utm_` names outside the list, are left as they are.

## Test log (0.3.1)

The popup shows what was removed on each page and what Get Clean URL's click would still remove ("missed"), including navigations inside an open page, which no rule can see. **Copy log** copies it as text. Nothing is shown while browsing.

The log keeps host, path and parameter names only, never their values, and stays in the browser's own storage (the last 500 pages). It works only when the extension is loaded unpacked: Chrome reports what a rule did only to an unpacked extension. It is for testing and does not go into a release.

## Build

```
node auto-clean/build.mjs
```

Then Load unpacked `auto-clean/dist`.

## Permissions

- `declarativeNetRequest`: removes the parameters from the address before the page loads.
- Access to all sites: Chrome only rewrites an address for a site the extension has access to.
- `storage`: keeps the switch on or off across updates, and the test log.
- `declarativeNetRequestFeedback` and `webNavigation` (test build only): what each rule removed, and where each page ended up, for the log.

Nothing is sent anywhere. The rules are in the package and never downloaded.
