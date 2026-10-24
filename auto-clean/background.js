// Chrome keeps a ruleset's enabled state across restarts, but puts it back to
// the manifest's default (off) whenever the extension is updated or reloaded.
// The choice is therefore kept in storage as well, and applied again on start
// and on every install or update.
import { describe, append } from './log.js';

const RULESET = 'safe';

async function apply() {
    const { on = false } = await chrome.storage.local.get('on');
    await chrome.declarativeNetRequest.updateEnabledRulesets(
        on ? { enableRulesetIds: [RULESET] } : { disableRulesetIds: [RULESET] });
    // 0.3.2 showed Chrome's own count, which is 1 on every cleaned page.
    await chrome.declarativeNetRequest.setExtensionActionOptions({
        displayActionCountAsBadgeText: false
    });
}

chrome.runtime.onStartup.addListener(apply);
chrome.runtime.onInstalled.addListener(apply);

// --- The number on the icon (off by default) -------------------------------
//
// How many names the rules took from the page in this tab. Chrome's own
// action count could not say: one redirect removes every name at once, so it
// read 1 on every cleaned page. Instead the redirect is watched as it
// happens - webRequest sees the address before and after - and counted once
// the page has loaded, because a page's badge is cleared as it starts to
// load. Only names in the rules count, so a site's own redirect that drops a
// parameter is not taken for the cleaner's.
const allNames = fetch(chrome.runtime.getURL('rules.json'))
    .then(response => response.json())
    .then(rules => new Set(rules.flatMap(rule =>
        rule.action.redirect.transform.queryTransform.removeParams)));

const takenInTab = new Map();

chrome.webRequest.onBeforeRedirect.addListener(async details => {
    const names = await allNames;
    const after = new URL(details.redirectUrl).searchParams;
    const taken = [...new URL(details.url).searchParams.keys()]
        .filter(name => names.has(name) && !after.has(name)).length;
    if (taken) takenInTab.set(details.tabId, (takenInTab.get(details.tabId) || 0) + taken);
}, { urls: ['<all_urls>'], types: ['main_frame'] });

chrome.tabs.onUpdated.addListener(async (tabId, change) => {
    if (change.status !== 'complete') return;
    const taken = takenInTab.get(tabId) || 0;
    takenInTab.delete(tabId);
    const { badge = false } = await chrome.storage.local.get('badge');
    await chrome.action.setBadgeText({ tabId, text: badge && taken ? String(taken) : '' });
});

// --- Test build only: the log ------------------------------------------------
//
// Two sources, joined by tab:
//
//   onRuleMatchedDebug  what a rule removed. Chrome sends it only to an
//                       extension loaded unpacked with
//                       declarativeNetRequestFeedback, and only when the
//                       redirect really removed something.
//   webNavigation       the address each page ended up at, after any
//                       redirect, and in-page navigations too, which no rule
//                       sees. That address is what is checked against Get
//                       Clean URL's click for anything missed.

// Each rule's names, read once from the rule file in the package.
const namesByRule = fetch(chrome.runtime.getURL('rules.json'))
    .then(response => response.json())
    .then(rules => new Map(rules.map(rule => [rule.id,
        new Set(rule.action.redirect.transform.queryTransform.removeParams)])));

// tab -> names the last redirect in it removed, waiting for the page to open.
const removedInTab = new Map();

chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener(async info => {
    if (info.rule.rulesetId !== RULESET || info.request.type !== 'main_frame') return;
    const names = (await namesByRule).get(info.rule.ruleId) || new Set();
    const query = [...new URL(info.request.url).searchParams.keys()];
    removedInTab.set(info.request.tabId, query.filter(name => names.has(name)));
});

async function record(url, removed, inPage) {
    const { on = false } = await chrome.storage.local.get('on');
    if (!on) return;
    try {
        const entry = describe(url, removed, inPage);
        // A page with nothing taken and nothing missed is not worth a line.
        if (entry.removed.length || entry.missed.length) await append(entry);
    } catch (error) {
        console.warn('could not log', error);
    }
}

chrome.webNavigation.onCommitted.addListener(details => {
    if (details.frameId !== 0) return;
    const removed = removedInTab.get(details.tabId) || [];
    removedInTab.delete(details.tabId);
    record(details.url, removed, false);
});

chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
    if (details.frameId !== 0) return;
    record(details.url, [], true);
});

chrome.tabs.onRemoved.addListener(tabId => {
    removedInTab.delete(tabId);
    takenInTab.delete(tabId);
});
