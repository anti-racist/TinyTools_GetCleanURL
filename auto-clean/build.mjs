// Builds the automatic cleaner into auto-clean/dist, ready to load unpacked.
//
//   node auto-clean/build.mjs
//
// Chrome only loads files inside the extension's own folder, so the rule file
// and icons are written into dist rather than referenced from the repo root.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanUrl } from '../src/cleaner.js';
import { safeParams, spellings } from './safe-params.js';
import { siteRules } from './site-rules.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');

// Every name must be one Get Clean URL already strips: the global ones on an
// ordinary site, each site's on that site.
for (const name of safeParams) {
    if (cleanUrl(`https://example.com/?${name}=1`).removedCount !== 1) {
        throw new Error(`${name} is not stripped everywhere by Get Clean URL`);
    }
}
for (const site of siteRules) {
    for (const name of spellings(site.names)) {
        if (cleanUrl(`${site.sample}?${name}=1&keep=1`).removedCount !== 1) {
            throw new Error(`${name} is not stripped on ${site.id} by Get Clean URL`);
        }
    }
}

// One rule, on every top-level GET that has a query, removing every name at
// once. Chrome makes no redirect when nothing is removed, so an address with
// none of these names loads as it is.
//
// Not one regular expression naming the parameters: Chrome caps a rule's regex
// at a small memory budget, and a pattern naming them went over it. Chrome then
// drops the rule without a word, so the switch said On and nothing was cleaned.
//
// Names are matched in exactly the spelling listed: queryTransform compares
// names case-sensitively, so a mixed spelling such as UTM_Source is left as
// it is (all lower and all upper case are listed).
const global = {
    id: 1,
    priority: 1,
    action: { type: 'redirect', redirect: { transform: { queryTransform: { removeParams: safeParams } } } },
    condition: {
        urlFilter: '?',
        resourceTypes: ['main_frame'],
        requestMethods: ['get']
    }
};

// Chrome carries out one redirect per request, the highest priority's. A
// site rule therefore removes the global names as well as its own, and
// outranks the global rule on its site.
const site = siteRules.map((s, i) => ({
    id: i + 2,
    priority: 2,
    action: { type: 'redirect', redirect: { transform: { queryTransform: {
        removeParams: [...new Set([...safeParams, ...spellings(s.names)])]
    } } } },
    condition: {
        urlFilter: s.filter,
        resourceTypes: ['main_frame'],
        requestMethods: ['get']
    }
}));

const rules = [global, ...site];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });
fs.writeFileSync(path.join(dist, 'rules.json'), JSON.stringify(rules, null, 2) + '\n');
for (const f of ['manifest.json', 'popup.html', 'popup.js', 'popup.css', 'background.js', 'log.js']) {
    fs.copyFileSync(path.join(here, f), path.join(dist, f));
}
// The log compares each page with what Get Clean URL's click would remove,
// so the cleaner itself goes in too.
fs.mkdirSync(path.join(dist, 'src'));
for (const f of ['cleaner.js', 'rules.js']) {
    fs.copyFileSync(path.join(here, '..', 'src', f), path.join(dist, 'src', f));
}
for (const f of ['icon16.png', 'icon48.png', 'icon128.png']) {
    fs.copyFileSync(path.join(here, '..', 'icons', f), path.join(dist, 'icons', f));
}
console.log(`dist: ${safeParams.length} global names, ${siteRules.length} site rules`);
