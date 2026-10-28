// The running count on the popup: tracking parameters removed to date, by
// the click and by automatic cleaning together. It stays in this browser's
// own storage and holds a number only - never an address or a name.

const KEY = 'removed';

// Writes are chained so that two pages cleaned at once do not lose a count.
let pending = Promise.resolve();

export function addRemoved(n) {
    if (!(n > 0)) return pending;
    pending = pending.then(async () => {
        const { [KEY]: stats = {} } = await chrome.storage.local.get(KEY);
        await chrome.storage.local.set({
            [KEY]: { total: (stats.total || 0) + n, seen: stats.seen || 0 }
        });
    }).catch(error => console.warn('count not saved:', error));
    return pending;
}

// The total, and how much of it came since the popup was last opened. Reading
// it marks the whole total seen, so the same +N is shown only once.
export async function takeCount() {
    await pending;
    const { [KEY]: stats = {} } = await chrome.storage.local.get(KEY);
    const total = stats.total || 0;
    const seen = Math.min(stats.seen || 0, total);
    if (seen !== total) {
        await chrome.storage.local.set({ [KEY]: { total, seen: total } });
    }
    return { total, delta: total - seen };
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
