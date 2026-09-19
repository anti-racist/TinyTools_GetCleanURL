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
        // before the click: nagging is what makes an extension feel pushy.
        restore();
        return;
    }

    const list = buildTabList(await getAllTabs());

    if (list.copied === 0) {
        show({ kind: 'batch-empty' });
        return;
    }
    if (!await copyToClipboard(list.text)) {
        show({ kind: 'batch-copy-failed' });
        return;
    }

    show({
        kind: 'batch-copied',
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
    const show = state => { current = state; renderer.show(state); };

    show({ kind: 'loading' });

    const button = document.getElementById('copy-all');
    if (button) {
        button.addEventListener('click', () => {
            // Asked for first and synchronously: any await before this loses
            // the user gesture. It resolves true without prompting when the
            // permission is already held, so there is nothing to check first.
            const granted = requestTabsPermission();
            const before = current;
            // The browser ignores what a listener returns; the tests await it.
            return copyAllTabs(granted, show, () => renderer.show(before))
                .catch(error => {
                    console.error('Copy all tabs failed:', error);
                    show({ kind: 'unexpected' });
                });
        });
    }

    await copyCurrentTab(show);
}

// Last line of defence: the popup must never sit on "Getting URL..." with no
// explanation, whatever goes wrong underneath.
function run() {
    return main().catch(error => {
        console.error('Unexpected popup failure:', error);
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
