// The switch shows the ruleset's own enabled state, and the choice is kept
// in storage too so background.js can restore it after an update.
import { read, clear, asText } from './log.js';

const RULESET = 'safe';
const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

async function isOn() {
    const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
    return enabled.includes(RULESET);
}

function show(on) {
    toggle.checked = on;
    status.textContent = on ? 'On: links are cleaned as pages open' : 'Off';
}

toggle.addEventListener('change', async () => {
    toggle.disabled = true;
    const on = toggle.checked;
    await chrome.storage.local.set({ on });
    await chrome.declarativeNetRequest.updateEnabledRulesets(
        on ? { enableRulesetIds: [RULESET] } : { disableRulesetIds: [RULESET] });
    show(await isOn());
    toggle.disabled = false;
});

show(await isOn());
toggle.disabled = false;

// Off by default. Chrome's own count: 1 on a page a rule cleaned, nothing on
// one it left alone. It counts what the rule did on the page, not how many
// names it took, and needs no permission of its own.
const badge = document.getElementById('badge');
badge.checked = (await chrome.storage.local.get('badge')).badge === true;
badge.disabled = false;
badge.addEventListener('change', async () => {
    await chrome.storage.local.set({ badge: badge.checked });
    await chrome.declarativeNetRequest.setExtensionActionOptions({
        displayActionCountAsBadgeText: badge.checked
    });
});

// The test log: a count, the latest pages, and the whole log on Copy.
const summary = document.getElementById('log-summary');
const list = document.getElementById('log-list');
const SHOWN = 8;

async function showLog() {
    const log = await read();
    const missed = log.filter(e => e.missed.length).length;
    summary.textContent = log.length
        ? `${log.length} pages logged, ${missed} with something missed.`
        : 'Nothing logged yet.';
    list.replaceChildren(...log.slice(-SHOWN).reverse().map(e => {
        const item = document.createElement('li');
        const where = document.createElement('span');
        where.className = 'where';
        where.textContent = e.host + e.path + (e.inPage ? ' (in-page)' : '');
        const what = document.createElement('span');
        what.className = 'what';
        what.textContent = (e.removed.length ? 'removed ' + e.removed.join(', ') : 'removed nothing')
            + (e.missed.length ? ' · missed ' + e.missed.join(', ') : '');
        item.append(where, what);
        return item;
    }));
}

document.getElementById('copy-log').addEventListener('click', async event => {
    const button = event.currentTarget;
    await navigator.clipboard.writeText(asText(await read()));
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = 'Copy log'; }, 1500);
});

document.getElementById('clear-log').addEventListener('click', async () => {
    await clear();
    await showLog();
});

await showLog();
