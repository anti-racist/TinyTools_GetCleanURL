// The excluded-sites page. The list lives in this browser's storage only;
// background.js reads it into the rules whenever it changes.

import { normaliseSite, isExcluded } from './src/auto.js';

const form = document.getElementById('add');
const input = document.getElementById('site');
const list = document.getElementById('list');
const count = document.getElementById('count');
const error = document.getElementById('error');

async function read() {
    const { excluded = [] } = await chrome.storage.local.get('excluded');
    return excluded;
}

async function render() {
    const excluded = await read();
    count.textContent = excluded.length === 1 ? '1 site excluded' : `${excluded.length} sites excluded`;
    list.replaceChildren(...excluded.map(site => {
        const item = document.createElement('li');
        const name = document.createElement('span');
        name.className = 'site';
        name.textContent = site;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', `Remove ${site}`);
        remove.addEventListener('click', async () => {
            await chrome.storage.local.set({ excluded: (await read()).filter(s => s !== site) });
        });
        item.append(name, remove);
        return item;
    }));
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    error.hidden = true;
    const site = normaliseSite(input.value);
    if (!site) {
        error.textContent = 'Enter a site such as example.com.';
        error.hidden = false;
        return;
    }
    const excluded = await read();
    if (isExcluded(site, excluded)) {
        error.textContent = `${site} is already left alone.`;
        error.hidden = false;
        return;
    }
    // A site also covers its subdomains, so one it now covers is dropped.
    await chrome.storage.local.set({
        excluded: [...excluded.filter(s => !isExcluded(s, [site])), site]
    });
    input.value = '';
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'excluded' in changes) render();
});

render();
