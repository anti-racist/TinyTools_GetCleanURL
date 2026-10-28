// Automatic cleaning, kept running in the background.
//
// Off until the person turns it on in the popup, which also asks for access
// to all sites: Chrome only rewrites an address on a site the extension has
// access to. That access is optional, so installing or updating the extension
// asks for nothing new. Turning the switch off hands the access back.

import { buildRules, ALL_SITES } from './auto.js';

// The rules are dynamic rather than a ruleset in the package: Chrome keeps
// dynamic rules across updates, while a ruleset's on/off state goes back to
// the manifest's default on every update. They are rewritten from rules.js
// whenever anything they depend on changes, so an update brings new names.
async function sync() {
    const [{ auto = false, excluded = [] }, access] = await Promise.all([
        chrome.storage.local.get(['auto', 'excluded']),
        chrome.permissions.contains(ALL_SITES)
    ]);
    const old = await chrome.declarativeNetRequest.getDynamicRules();
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: old.map(rule => rule.id),
        addRules: auto && access ? buildRules(excluded) : []
    });
}

function syncLogged() {
    return sync().catch(error => console.warn('automatic cleaning not updated:', error));
}

chrome.runtime.onInstalled.addListener(syncLogged);
chrome.runtime.onStartup.addListener(syncLogged);
// Access can also be taken back from the browser's own extension settings.
chrome.permissions.onAdded.addListener(syncLogged);
chrome.permissions.onRemoved.addListener(syncLogged);
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && ('auto' in changes || 'excluded' in changes)) syncLogged();
});
