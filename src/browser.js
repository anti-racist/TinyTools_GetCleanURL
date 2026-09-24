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
                    // Debug, not warn: getActiveTab() treats an empty result as
                    // a cue to try the next query, so a failure here is part of
                    // how the fallback chain works rather than something gone
                    // wrong. When every query fails the popup says so itself.
                    console.debug('tabs.query failed:', chrome.runtime.lastError.message);
                    resolve([]);
                    return;
                }
                resolve(Array.isArray(tabs) ? tabs : []);
            });
        } catch (error) {
            console.debug('tabs.query threw:', error);
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
    //
    //    It stops self-limiting once the optional `tabs` permission is held
    //    for Copy all open tabs: then every window's active tab is readable,
    //    and taking the first one copied another window's page. Only an
    //    unambiguous answer is used; more than one means we cannot tell which
    //    tab the user meant, and copying the wrong URL is worse than none.
    const candidates = (await queryTabs({ active: true })).filter(isWebPageTab);
    return candidates.length === 1 ? candidates[0] : null;
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

    try {
        document.body.appendChild(field);
        field.select();
        field.setSelectionRange(0, text.length);
        return document.execCommand('copy');
    } catch (error) {
        console.debug('Selection-based copy failed:', error);
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
        // Expected, not exceptional. The async API needs the document to hold
        // focus, and the popup's copy-on-open is not a user gesture; some
        // browsers host the popup so that it never holds focus at that moment.
        // The synchronous path below is there for exactly this and handles it.
        //
        // Logged at debug level on purpose: console.error here puts a red
        // "Errors" badge on the extension for every single copy those users
        // make, and an unexplained error on a privacy tool is how support mail
        // starts - the v1.3 report that led to v1.4 opened with "is it
        // actually sending the URL to a remote service?".
        console.debug(`Clipboard write attempt ${retryCount + 1} fell back:`, error);

        // A focus failure will not resolve itself by waiting, so try the
        // synchronous path before spending any time on a retry.
        if (copyViaSelection(text)) return true;

        if (retryCount < CLIPBOARD_MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, CLIPBOARD_RETRY_DELAY));
            return copyToClipboard(text, retryCount + 1);
        }

        // Every path has now failed and the user is being told so. This one is
        // a real error and is the only clipboard message worth reporting.
        console.error('Clipboard write failed after every fallback:', error);
        return false;
    }
}

// Every tab in every window.
//
// Deliberately unfiltered: `currentWindow` is what resolves to Vivaldi's own
// UI window when the query runs from inside the popup, which is the whole
// reason getActiveTab() above needs its fallback chain. Asking for all tabs
// never has to resolve a window at all, so it cannot go wrong that way.
//
// Without the `tabs` permission this still resolves, but Chrome strips `url`
// from every entry - so the caller must hold the permission before it means
// anything.
export function getAllTabs() {
    return queryTabs({});
}

function permissionsApi() {
    return (typeof chrome !== 'undefined' && chrome.permissions) || null;
}

// Resolves false rather than rejecting: a popup that cannot ask for a
// permission should quietly do nothing, not break.
//
// Called directly from the click handler, before anything is awaited. Chrome
// only honours permissions.request() inside the user gesture that triggered
// it, and awaiting any other API first is enough to lose it. Asking when the
// permission is already held is free - it resolves true without prompting -
// so there is nothing to check beforehand.
export function requestTabsPermission() {
    return new Promise(resolve => {
        const api = permissionsApi();
        if (!api || !api.request) return resolve(false);
        try {
            api.request({ permissions: ['tabs'] }, granted => {
                if (chrome.runtime && chrome.runtime.lastError) return resolve(false);
                resolve(granted === true);
            });
        } catch (error) {
            console.warn('permissions.request threw:', error);
            resolve(false);
        }
    });
}
