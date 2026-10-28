// Popup entry point: wire the cleaner, the browser layer and the UI together.

import { cleanUrl, isShareable } from './src/cleaner.js';
import { buildTabList } from './src/batch.js';
import {
    getActiveTab, getAllTabs, copyToClipboard, requestTabsPermission
} from './src/browser.js';
import { createRenderer, tone } from './src/ui.js';
import { ALL_SITES, normaliseSite, isExcluded } from './src/auto.js';
import { addRemoved, readCount, formatCount } from './src/stats.js';

// Counts the click's removals toward the running total. Opening the popup
// copies again, so the same address is counted once, not on every opening.
// What is kept to tell is a SHA-256 fingerprint, not the address: the privacy
// policy promises no address is stored.
async function countClick(url, removed) {
    if (!(removed > 0)) return;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url));
    const fingerprint = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
    const { counted } = await chrome.storage.local.get('counted');
    if (counted === fingerprint) return;
    await chrome.storage.local.set({ counted: fingerprint });
    await addRemoved(removed);
}

// The automatic path: whatever tab the popup was opened over. Returns the tab,
// for the Exclude current site row.
async function copyCurrentTab(show) {
    const tab = await getActiveTab();
    if (!tab || !tab.url) {
        show({ kind: 'no-tab' });
        return null;
    }

    // Before cleaning, and before the clipboard is touched at all. v1.4 and
    // v1.5 copied whatever the tab held, so opening the popup on a browser
    // start page quietly replaced whatever the user already had.
    if (!isShareable(tab.url)) {
        show({ kind: 'not-shareable' });
        return tab;
    }

    let cleaned;
    try {
        cleaned = cleanUrl(tab.url);
    } catch (error) {
        console.error('Error cleaning URL:', error);
        show({ kind: 'invalid-url' });
        return tab;
    }

    if (!await copyToClipboard(cleaned.url)) {
        show({ kind: 'copy-failed', url: cleaned.url });
        return tab;
    }

    show(cleaned.changed
        ? { kind: 'cleaned', url: cleaned.url, removed: cleaned.removedCount }
        : { kind: 'already-clean', url: cleaned.url });
    await countClick(tab.url, cleaned.removedCount);
    return tab;
}

// The button. `granted` is resolved by the caller inside the click's own user
// gesture, because Chrome will not honour permissions.request() outside it.
async function copyAllTabs(granted, show, restore) {
    if (!await granted) {
        // Declined. Say nothing about it and put back what was on screen
        // before the click.
        restore();
        return;
    }

    const list = buildTabList(await getAllTabs());

    if (list.copied === 0) {
        show({ kind: 'batch-empty' });
        return;
    }
    if (!await copyToClipboard(list.text)) {
        show({ kind: 'batch-copy-failed', text: list.text });
        return;
    }

    show({
        kind: 'batch-copied',
        text: list.text,
        copied: list.copied,
        skipped: list.skipped,
        merged: list.merged
    });
    await addRemoved(list.removed);
    showCount(await readCount());
}

// --- Around the card: the count, the switch, support --------------------------

// The day, in the person's own time zone: the thank-you card lasts until
// midnight.
const today = () => new Date().toLocaleDateString('en-CA');

const $ = id => document.getElementById(id);

// "N tracking parameters removed to date". Hidden at zero rather than showing
// a 0.
function showCount(total) {
    const line = $('counter');
    if (!line) return;
    line.hidden = total === 0;
    $('counter-number').textContent = formatCount(total);
}

// The support row stays off browser pages, where there is nothing to share;
// the thank-you card stays away from an error.
async function showExtras(state) {
    const kind = tone(state.kind);
    const browserPage = state.kind === 'not-shareable' || state.kind === 'no-tab';
    const support = $('support');
    if (support) support.hidden = state.kind === 'loading' || browserPage;
    const { thanked } = await chrome.storage.local.get('thanked');
    const thanks = $('thanks');
    if (thanks) thanks.hidden = thanked !== today() || kind === 'error' || state.kind === 'loading';
}

// Rate and Buy me a coffee open in a new tab. The day is written first,
// because opening a tab closes the popup. Only the click can be seen, not
// whether a rating or a coffee followed, so the card thanks for the support
// and promises nothing.
function wireSupport() {
    for (const link of document.querySelectorAll('.support-link')) {
        link.addEventListener('click', async event => {
            event.preventDefault();
            await chrome.storage.local.set({ thanked: today() });
            chrome.tabs.create({ url: link.href });
        });
    }
}

// The switch. Turning it on asks Chrome for access to all sites, in the click
// itself: Chrome only honours a permission request inside the user's gesture.
// Turning it off gives the access back. background.js follows the stored
// choice and the access, and writes the rules.
async function wireSwitch(tab) {
    const button = $('auto-switch');
    if (!button) return;
    const note = $('auto-note');

    const isOn = async () => {
        const [{ auto = false }, access] = await Promise.all([
            chrome.storage.local.get('auto'),
            chrome.permissions.contains(ALL_SITES)
        ]);
        return auto && access;
    };

    const host = tab && /^https?:/.test(tab.url || '') ? normaliseSite(new URL(tab.url).hostname) : null;

    async function render(on) {
        button.setAttribute('aria-checked', String(on));
        $('auto-state').textContent = on ? 'On' : 'Off';
        const row = $('auto-row');
        row.hidden = !on;
        const exclude = $('exclude');
        exclude.hidden = !host;
        if (host) {
            const { excluded = [] } = await chrome.storage.local.get('excluded');
            const off = isExcluded(host, excluded);
            exclude.dataset.excluded = String(off);
            $('exclude-text').textContent = off ? `Excluded ${host} · Undo` : 'Exclude current site';
        }
    }

    button.addEventListener('click', async () => {
        const turningOn = button.getAttribute('aria-checked') !== 'true';
        note.hidden = true;
        if (turningOn) {
            // Asked for before anything is awaited, or the gesture is lost.
            const asked = chrome.permissions.request(ALL_SITES);
            let granted = false;
            try {
                granted = await asked;
            } catch (error) {
                console.warn('permissions.request failed:', error);
            }
            if (!granted) {
                note.textContent = 'Turning this on needs access to all sites, to clean each link as it opens.';
                note.hidden = false;
                return render(false);
            }
            await chrome.storage.local.set({ auto: true });
        } else {
            await chrome.storage.local.set({ auto: false });
            await chrome.permissions.remove(ALL_SITES).catch(() => {});
        }
        render(await isOn());
    });

    $('exclude').addEventListener('click', async () => {
        if (!host) return;
        const { excluded = [] } = await chrome.storage.local.get('excluded');
        const next = isExcluded(host, excluded)
            ? excluded.filter(site => !isExcluded(host, [site]))
            : [...excluded, host];
        await chrome.storage.local.set({ excluded: next });
        render(true);
    });

    $('edit-sites').addEventListener('click', () => chrome.runtime.openOptionsPage());

    await render(await isOn());
    button.disabled = false;
}

async function main() {
    const base = createRenderer(
        document.getElementById('url-display'),
        document.getElementById('message'),
        document.getElementById('status')
    );
    const renderer = {
        show(state) {
            base.show(state);
            showExtras(state).catch(error => console.debug('extras:', error));
        }
    };

    let current = { kind: 'loading' };
    let owner = 0;
    // What a path tried to show while another held ownership, by claimant.
    const suppressed = new Map();

    // Two paths can be in flight at once. The automatic copy starts when the
    // popup opens, and the button is live before it finishes - so a user whose
    // tabs permission is already granted can complete a batch while the single
    // copy is still waiting on the clipboard, which on the retry path is up to
    // 750ms. Without this, the single result lands on top of "Copied 14 URLs"
    // and the user is told the wrong thing about their own clipboard.
    //
    // Ownership is taken when a path STARTS, not when it renders - the stale
    // path is the one that started earlier, and it is also the one that tends
    // to render later, which is the whole problem. A path that ends without
    // rendering anything, which is what declining the permission does, hands
    // ownership back so the copy still running behind it can finish.
    function claimant() {
        const mine = ++owner;
        let rendered = false;
        const show = state => {
            if (mine !== owner) {
                suppressed.set(mine, state);
                return;
            }
            rendered = true;
            current = state;
            renderer.show(state);
        };
        // Returns true when handing ownership back also rendered the result
        // the earlier path produced while this one held it. Without that, a
        // single copy that finished while the permission prompt was open was
        // dropped, and declining put back the blank loading state over a
        // clipboard that had in fact been written.
        show.release = () => {
            if (rendered || owner !== mine) return false;
            owner = mine - 1;
            const late = suppressed.get(owner);
            if (!late) return false;
            suppressed.delete(owner);
            current = late;
            renderer.show(late);
            return true;
        };
        return show;
    }

    renderer.show(current);

    const button = document.getElementById('copy-all');
    if (button) {
        let running = false;
        button.addEventListener('click', () => {
            // Nothing is disabled on screen; a second batch would simply
            // duplicate the first, so the second click is dropped instead.
            if (running) return;
            running = true;
            // Asked for first and synchronously: any await before this loses
            // the user gesture. It resolves true without prompting when the
            // permission is already held, so there is nothing to check first.
            const granted = requestTabsPermission();
            const before = current;
            const show = claimant();
            // The browser ignores what a listener returns; the tests await it.
            return copyAllTabs(granted, show, () => { if (!show.release()) renderer.show(before); })
                .catch(error => {
                    console.error('Copy all tabs failed:', error);
                    show({ kind: 'unexpected' });
                })
                .finally(() => { running = false; });
        });
    }

    wireSupport();
    showCount(await readCount().catch(() => 0));

    const tab = await copyCurrentTab(claimant());

    // The click may have added to the total.
    showCount(await readCount().catch(() => 0));
    await wireSwitch(tab);
}

// Last line of defence: the popup must never sit there saying nothing,
// whatever goes wrong underneath.
function run() {
    return main().catch(error => {
        console.error('Unexpected popup failure:', error);
        // Written by hand rather than through the renderer, because whatever
        // failed may be inside it. The box is hidden for the same reason: if
        // it is showing a URL at this point, there is no longer any promise
        // that it is the one on the clipboard.
        const urlElement = document.getElementById('url-display');
        if (urlElement) urlElement.hidden = true;
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.className = 'error';
            messageElement.textContent = 'Something went wrong. Please try again.';
        }
    });
}

// Module scripts are deferred, so the DOM is normally parsed by now; the guard
// keeps this correct if that ever stops being true.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
} else {
    run();
}
