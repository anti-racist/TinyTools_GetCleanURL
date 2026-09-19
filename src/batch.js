// Turning a window full of tabs into one clipboard payload.
//
// Pure: it takes plain objects that happen to have a `url`, never a chrome.*
// call, so the whole of the batch logic is testable without a browser. The
// browser layer's only job is to hand it the tabs.

import { cleanUrl, isShareable, isLocalFile } from './cleaner.js';

// Tabs in the order they sit in the window, one clean URL per line.
//
// Duplicates are merged after cleaning rather than before, which is the point
// of cleaning first: three tabs on the same product carrying three different
// tracking tokens are three URLs before and one after.
export function buildTabList(tabs) {
    const seen = new Set();
    const links = [];
    let skipped = 0;
    let merged = 0;

    for (const tab of tabs || []) {
        const url = tab && tab.url;

        // Browser pages, extension pages and anything unparseable. Counted
        // rather than dropped silently, so the total the user is told about
        // adds up to the number of tabs they can see.
        //
        // Local files are skipped here although a single copy keeps them.
        // The two actions differ: copying one file:// URL is a deliberate act
        // on a page you are looking at, while a batch is a sweep that tends to
        // be pasted somewhere else whole - and a local path reveals your
        // directory layout while being useless to whoever receives it.
        if (typeof url !== 'string' || !isShareable(url) || isLocalFile(url)) {
            skipped++;
            continue;
        }

        let cleaned;
        try {
            cleaned = cleanUrl(url);
        } catch {
            skipped++;
            continue;
        }

        if (seen.has(cleaned.url)) {
            merged++;
            continue;
        }
        seen.add(cleaned.url);
        links.push(cleaned.url);
    }

    return { text: links.join('\n'), copied: links.length, skipped, merged };
}
