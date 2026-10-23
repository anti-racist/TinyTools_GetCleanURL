# Auto Clean URL (experiment)

A separate, experimental extension that removes common tracking parameters automatically as pages open, with a switch that is off until it is turned on. It is not part of Get Clean URL and does not ship with it.

## What it removes

Only the names in `safe-params.js`: the `utm_` tags, `fbclid`, `gclid` and other tracking parameters that are safe on every site. Site rules stay with Get Clean URL's one click.

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
