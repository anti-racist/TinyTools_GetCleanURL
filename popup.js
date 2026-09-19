// Popup entry point: wire the cleaner, the browser layer and the UI together.

import { cleanUrl } from './src/cleaner.js';
import { getActiveTab, copyToClipboard } from './src/browser.js';
import { createRenderer } from './src/ui.js';

// Schemes that can carry a link worth sharing. Everything else a tab can hold
// is browser furniture - chrome://, edge://, vivaldi://, about:, an extension
// page - whose address is of no use to anyone it is sent to.
//
// An allowlist rather than a list of browser schemes to block: that list
// differs per browser and anything missing from it would leave the bug in
// place there. v1.4 and v1.5 copied whatever the tab held, so opening the
// popup on a start page quietly overwrote the clipboard with an internal URL
// and reported "URL already clean".
const SHAREABLE_SCHEMES = new Set(['http:', 'https:', 'file:']);

function isShareable(urlString) {
    try {
        return SHAREABLE_SCHEMES.has(new URL(urlString).protocol);
    } catch {
        return false;
    }
}

async function main() {
    const { show } = createRenderer(
        document.getElementById('url-display'),
        document.getElementById('message')
    );

    show({ kind: 'loading' });

    const tab = await getActiveTab();
    if (!tab || !tab.url) {
        show({ kind: 'no-tab' });
        return;
    }

    // Checked before cleaning, and before the clipboard is touched at all.
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
