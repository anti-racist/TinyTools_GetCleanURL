// Popup entry point: wire the cleaner, the browser layer and the UI together.

import { cleanUrl } from './src/cleaner.js';
import { getActiveTab, copyToClipboard } from './src/browser.js';
import { createRenderer } from './src/ui.js';

async function main() {
    const { displayMessage, displayUrl, displayStatus } = createRenderer(
        document.getElementById('url-display'),
        document.getElementById('message')
    );

    displayStatus('Getting URL...');

    const tab = await getActiveTab();
    if (!tab || !tab.url) {
        displayStatus('No URL available');
        displayMessage('No valid URL found. Try reloading the page.', 'error');
        return;
    }

    let cleaned;
    try {
        cleaned = cleanUrl(tab.url);
    } catch (error) {
        console.error('Error cleaning URL:', error);
        displayStatus('Invalid URL');
        displayMessage('The URL is not valid. Please try again.', 'error');
        return;
    }

    displayUrl(cleaned.url);

    if (!await copyToClipboard(cleaned.url)) {
        displayMessage('Copy failed! Please check browser permissions and try again.', 'error');
        return;
    }

    if (cleaned.changed) {
        const plural = cleaned.removedCount !== 1 ? 's' : '';
        displayMessage(
            `Copied: URL cleaned (${cleaned.removedCount} tracking parameter${plural} removed)`,
            'success'
        );
    } else {
        displayMessage('Copied: URL already clean (No changes)', 'info');
    }
}

// Module scripts are deferred, so the DOM is normally parsed by now; the guard
// keeps this correct if that ever stops being true.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
