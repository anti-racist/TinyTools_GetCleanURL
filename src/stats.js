// The running count on the popup: tracking parameters removed to date by the
// click and by Copy all open tabs. It stays in this browser's own storage and
// holds a number only - never an address or a name.
//
// Automatic cleaning is not counted. Seeing its redirects needs webRequest,
// and Chrome refuses a webRequest listener - with an error on the extension's
// page - until access to all sites is granted, which is only once Auto-clean
// is turned on; a listener added later does not wake the background worker.

const KEY = 'removed';

// Writes are chained so that two pages cleaned at once do not lose a count.
let pending = Promise.resolve();

export function addRemoved(n) {
    if (!(n > 0)) return pending;
    pending = pending.then(async () => {
        const { [KEY]: stats = {} } = await chrome.storage.local.get(KEY);
        await chrome.storage.local.set({
            [KEY]: { total: (stats.total || 0) + n }
        });
    }).catch(error => console.warn('count not saved:', error));
    return pending;
}

export async function readCount() {
    await pending;
    const { [KEY]: stats = {} } = await chrome.storage.local.get(KEY);
    return stats.total || 0;
}

// 47, 1,284, 12.8K, 128K, 1.28M, 12.8M, 1.28B. Rounded down, so the count
// never claims more than was removed.
export function formatCount(n) {
    const floor = (value, places) => {
        const f = 10 ** places;
        return (Math.floor(value * f) / f).toFixed(places);
    };
    if (n < 10000) return n.toLocaleString('en-US');
    if (n < 100000) return floor(n / 1e3, 1) + 'K';
    if (n < 1e6) return Math.floor(n / 1e3) + 'K';
    if (n < 1e7) return floor(n / 1e6, 2) + 'M';
    if (n < 1e9) return floor(n / 1e6, 1) + 'M';
    return floor(n / 1e9, 2) + 'B';
}
