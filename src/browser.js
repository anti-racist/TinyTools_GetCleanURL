// The entire chrome.* surface. Everything here needs a real browser to
// exercise, so it is kept deliberately small and separate from the cleaning
// logic, which is fully covered by tests.

const CLIPBOARD_MAX_RETRIES = 3;
const CLIPBOARD_RETRY_DELAY = 250;

// chrome.tabs.query never rejects; it reports failure through lastError and
// can hand back undefined. Normalise all of that to an array.
function queryTabs(options) {
    return new Promise(resolve => {
        try {
            chrome.tabs.query(options, tabs => {
                if (chrome.runtime && chrome.runtime.lastError) {
                    console.warn('tabs.query failed:', chrome.runtime.lastError.message);
                    resolve([]);
                    return;
                }
                resolve(Array.isArray(tabs) ? tabs : []);
            });
        } catch (error) {
            console.warn('tabs.query threw:', error);
            resolve([]);
        }
    });
}

// Only used to pick between candidates in the fallback paths, where we have to
// tell the user's page apart from a browser-UI tab.
function isWebPageTab(tab) {
    if (!tab || typeof tab.url !== 'string') return false;
    try {
        const { protocol } = new URL(tab.url);
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
}

// Resolve the tab whose URL the user means to clean.
//
// Chrome and Edge always answer on the first query, so the fallbacks below are
// unreachable for them and cannot change their behaviour. Vivaldi hosts the
// action popup differently and can resolve `currentWindow` to a window whose
// active tab is its own UI rather than the user's page, which left the popup
// reporting "No valid URL found" from v1.4 onwards.
export async function getActiveTab() {
    // 1. Standard path. Accept whatever it returns, exactly as v1.4 did, so
    //    non-web tabs (chrome://, file://) keep working where they did before.
    const [primary] = await queryTabs({ active: true, currentWindow: true });
    if (primary && primary.url) return primary;

    // 2. The popup's window was not the browser window. Ask for the window the
    //    user last focused instead.
    const [lastFocused] = await queryTabs({ active: true, lastFocusedWindow: true });
    if (isWebPageTab(lastFocused)) return lastFocused;

    // 3. Last resort: any active tab that is a real web page. Under activeTab
    //    only the granted tab exposes a readable url, so this self-limits.
    const anyActive = await queryTabs({ active: true });
    return anyActive.find(isWebPageTab) || null;
}

// Synchronous clipboard write that does not require the async API's focus
// guarantees. Deprecated, but it is the only path that works when the popup
// does not hold document focus.
function copyViaSelection(text) {
    if (!document.body) return false;

    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '-1000px';
    field.style.opacity = '0';

    document.body.appendChild(field);
    try {
        field.select();
        field.setSelectionRange(0, text.length);
        return document.execCommand('copy');
    } catch (error) {
        console.warn('Selection-based copy failed:', error);
        return false;
    } finally {
        field.remove();
    }
}

export async function copyToClipboard(text, retryCount = 0) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error(`Clipboard write attempt ${retryCount + 1} failed:`, error);

        // A focus failure will not resolve itself by waiting, so try the
        // synchronous path before spending any time on a retry.
        if (copyViaSelection(text)) return true;

        if (retryCount < CLIPBOARD_MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, CLIPBOARD_RETRY_DELAY));
            return copyToClipboard(text, retryCount + 1);
        }

        return false;
    }
}
