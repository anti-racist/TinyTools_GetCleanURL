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
import { safeParams } from './safe-params.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');

// Every name must be one Get Clean URL already strips on an ordinary site.
for (const name of safeParams) {
    if (cleanUrl(`https://example.com/?${name}=1`).removedCount !== 1) {
        throw new Error(`${name} is not stripped everywhere by Get Clean URL`);
    }
}

// One rule per name rather than one regular expression for all of them:
// Chrome caps a rule's regex at a small memory budget, and a pattern naming
// every parameter went over it. Chrome then drops the rule without a word, so
// the switch said On and nothing was cleaned.
//
// `^` in a urlFilter is a separator - here the ? or & in front of the name.
// Each rule removes every name, so one redirect cleans the whole address.
// Names are matched in exactly this spelling: queryTransform compares names
// case-sensitively, so a rule that fired on UTM_Source would redirect to the
// same address.
const rules = safeParams.map((name, i) => ({
    id: i + 1,
    priority: 1,
    action: { type: 'redirect', redirect: { transform: { queryTransform: { removeParams: safeParams } } } },
    condition: {
        urlFilter: `^${name}=`,
        isUrlFilterCaseSensitive: true,
        resourceTypes: ['main_frame'],
        requestMethods: ['get']
    }
}));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });
fs.writeFileSync(path.join(dist, 'rules.json'), JSON.stringify(rules, null, 2) + '\n');
for (const f of ['manifest.json', 'popup.html', 'popup.js', 'popup.css', 'background.js']) {
    fs.copyFileSync(path.join(here, f), path.join(dist, f));
}
for (const f of ['icon16.png', 'icon48.png', 'icon128.png']) {
    fs.copyFileSync(path.join(here, '..', 'icons', f), path.join(dist, 'icons', f));
}
console.log(`dist: ${safeParams.length} names`);
