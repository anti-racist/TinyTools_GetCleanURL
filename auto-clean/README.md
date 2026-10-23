# Auto Clean URL (experiment)

A separate, experimental extension that removes common tracking parameters automatically as pages open, with a switch that is off until it is turned on. It is not part of Get Clean URL and does not ship with it.

## What it removes

Every global name in Get Clean URL's rules (272 with the prefix families - `utm_`, `fb_`, `pk_`, `mtm_`, `hsa_`, `cm_mmc` - spelled out, since Chrome cannot match a prefix), built from `src/rules.js` so the two never drift apart. Site rules stay with Get Clean URL's one click. Chrome matches names exactly, so an upper-case spelling such as `UTM_SOURCE`, and `utm_` names outside the list, are left as they are.

## Build

```
node auto-clean/build.mjs
```

Then Load unpacked `auto-clean/dist`.

## Permissions

- `declarativeNetRequest`: removes the parameters from the address before the page loads.
- Access to all sites: Chrome only rewrites an address for a site the extension has access to.
- `storage`: keeps the switch on or off across updates.

Nothing is sent anywhere. The rules are in the package and never downloaded.
