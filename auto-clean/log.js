// A test-build log of what the automatic cleaner did, kept so the person
// testing can see it working and send back what it missed. Nothing is shown
// while browsing: entries are only read when the popup is opened.
//
// Each entry holds the host and path and parameter names only, never their
// values, so a sign-in token or an order number in a link never lands here.
// It stays in this browser's storage and is copied out only by the Copy log
// button.
import { cleanUrl } from './src/cleaner.js';

const KEY = 'log';
const MAX = 500;

// The names in a query, in the order and spelling they arrived.
function names(search) {
    return [...new URLSearchParams(search).keys()];
}

// One page: `url` is where it ended up, `removed` the names a rule took on
// the way, and `missed` what Get Clean URL's click would still take from it.
// `inPage` marks a navigation inside an open page, which no rule can see.
export function describe(urlString, removed, inPage) {
    const url = new URL(urlString);
    const left = names(url.search);

    let after;
    try {
        after = new Set(names(new URL(cleanUrl(urlString).url).search));
    } catch {
        after = new Set(left);
    }

    return {
        time: new Date().toISOString(),
        host: url.hostname,
        path: url.pathname.length > 80 ? url.pathname.slice(0, 80) + '…' : url.pathname,
        inPage,
        removed,
        missed: left.filter(name => !after.has(name))
    };
}

// Writes are chained so that two pages opening at once do not overwrite each
// other's entry.
let pending = Promise.resolve();

export function append(entry) {
    pending = pending.then(async () => {
        const { [KEY]: log = [] } = await chrome.storage.local.get(KEY);
        log.push(entry);
        await chrome.storage.local.set({ [KEY]: log.slice(-MAX) });
    }).catch(error => console.warn('log write failed:', error));
    return pending;
}

export async function read() {
    const { [KEY]: log = [] } = await chrome.storage.local.get(KEY);
    return log;
}

export function clear() {
    return chrome.storage.local.remove(KEY);
}

// One line per entry, newest last, for pasting into a message.
export function asText(log) {
    return log.map(e => [
        e.time.slice(0, 16).replace('T', ' '),
        e.host + e.path + (e.inPage ? ' (in-page)' : ''),
        'removed: ' + (e.removed.join(', ') || '-'),
        'missed: ' + (e.missed.join(', ') || '-')
    ].join(' | ')).join('\n');
}
