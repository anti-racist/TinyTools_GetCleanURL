// Chrome keeps a ruleset's enabled state across restarts, but puts it back to
// the manifest's default (off) whenever the extension is updated or reloaded.
// The choice is therefore kept in storage as well, and applied again on start
// and on every install or update.
const RULESET = 'safe';

async function apply() {
    const { on = false } = await chrome.storage.local.get('on');
    await chrome.declarativeNetRequest.updateEnabledRulesets(
        on ? { enableRulesetIds: [RULESET] } : { disableRulesetIds: [RULESET] });
}

chrome.runtime.onStartup.addListener(apply);
chrome.runtime.onInstalled.addListener(apply);
