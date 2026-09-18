// The entire chrome.* surface. Everything here needs a real browser to
// exercise, so it is kept deliberately small and separate from the cleaning
// logic, which is fully covered by tests.

const CLIPBOARD_MAX_RETRIES = 3;
const CLIPBOARD_RETRY_DELAY = 1000;

// Resolve the tab whose URL the user means to clean.
export function getActiveTab() {
    return new Promise(resolve => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            resolve(tabs && tabs.length ? tabs[0] : null);
        });
    });
}

export async function copyToClipboard(text, retryCount = 0) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error(`Clipboard write attempt ${retryCount + 1} failed:`, error);

        if (retryCount < CLIPBOARD_MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, CLIPBOARD_RETRY_DELAY));
            return copyToClipboard(text, retryCount + 1);
        }

        return false;
    }
}
