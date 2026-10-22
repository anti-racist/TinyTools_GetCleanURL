// Popup entry point: wire the cleaner, the browser layer and the UI together.

import { cleanUrl, isShareable } from './src/cleaner.js';
import { buildTabList } from './src/batch.js';
import {
    getActiveTab, getAllTabs, copyToClipboard, requestTabsPermission
} from './src/browser.js';
import { createRenderer } from './src/ui.js';

// The automatic path: whatever tab the popup was opened over.
async function copyCurrentTab(show) {
    const tab = await getActiveTab();
    if (!tab || !tab.url) {
        show({ kind: 'no-tab' });
        return;
    }

    // Before cleaning, and before the clipboard is touched at all. v1.4 and
    // v1.5 copied whatever the tab held, so opening the popup on a browser
    // start page quietly replaced whatever the user already had.
    if (!isShareable(tab.url)) {
        show({ kind: 'not-shareable' });
        return;
    }

    let cleaned;
    try {
        cleaned = cleanUrl(tab.url);
    } catch (error) {
        console.error('Error cleaning URL:', error);
        show({ kind: 'invalid-url' });
        return;
    }

    if (!await copyToClipboard(cleaned.url)) {
        show({ kind: 'copy-failed', url: cleaned.url });
        return;
    }

    show(cleaned.changed
        ? { kind: 'cleaned', url: cleaned.url, removed: cleaned.removedCount }
        : { kind: 'already-clean', url: cleaned.url });
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
}

async function main() {
    const renderer = createRenderer(
        document.getElementById('url-display'),
        document.getElementById('message')
    );

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

    await copyCurrentTab(claimant());
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
