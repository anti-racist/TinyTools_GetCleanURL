// The switch shows the ruleset's own enabled state, and the choice is kept
// in storage too so background.js can restore it after an update.
const RULESET = 'safe';
const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

async function isOn() {
    const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
    return enabled.includes(RULESET);
}

function show(on) {
    toggle.checked = on;
    status.textContent = on ? 'On: links are cleaned as pages open' : 'Off';
}

toggle.addEventListener('change', async () => {
    toggle.disabled = true;
    const on = toggle.checked;
    await chrome.storage.local.set({ on });
    await chrome.declarativeNetRequest.updateEnabledRulesets(
        on ? { enableRulesetIds: [RULESET] } : { disableRulesetIds: [RULESET] });
    show(await isOn());
    toggle.disabled = false;
});

show(await isOn());
toggle.disabled = false;
