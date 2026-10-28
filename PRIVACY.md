# Privacy policy: Get Clean URL

Last updated: 28 October 2026

Get Clean URL is a browser extension published by Maggie Mao.

## In short

- The extension sends nothing anywhere. It has no server, no account,
  no analytics and no network code.
- It keeps its settings and a running count in your browser's own
  storage, on your device. None of it is an address you visited.
- It does not sell data, show ads, or track you across sites.

## What it handles

| Data | When | Where it goes | How long it is kept |
| --- | --- | --- | --- |
| The address of the tab you are on | When you click the toolbar icon | Cleaned inside the extension, then copied to your clipboard | Not stored |
| The addresses of all your open tabs | Only when you press **Copy all open tabs**, and only after you allow the optional `tabs` permission | Cleaned inside the extension, then copied to your clipboard as a list | Not stored |
| The address of each page you open | Only while **Auto-clean** is on, after you allow access to all sites | Your browser removes the tracking parameters before the page loads, using rules inside the extension | Not stored |

Tab titles are never read.

## What it stores

Everything below stays in your browser's own storage (`chrome.storage.local`) on your device. It is not synced and never sent anywhere. Removing the extension deletes it.

| Item | What it holds |
| --- | --- |
| Auto-clean on or off | One setting |
| Excluded sites | The sites you chose for Auto-clean to leave alone, as bare names such as `example.com` |
| Running count | How many tracking parameters the toolbar icon and **Copy all open tabs** have removed to date: a number only, no addresses or names |
| Last page counted | A fingerprint (a SHA-256 hash) of the last address the toolbar icon cleaned, so reopening the popup on the same page does not count it twice. The address cannot be read back from it. Replaced on the next one |
| Thank-you day | The date you last clicked **Rate Get Clean URL** or **Buy me a coffee**, so the thank-you card shows for the rest of that day |

## Links to other sites

**Rate Get Clean URL** opens the extension's page on the Chrome Web Store, and **Buy me a coffee** opens buymeacoffee.com. Both open in a new tab, only when you click them, and carry nothing from the extension. Those sites have their own privacy policies.

## Permissions

| Permission | Why |
| --- | --- |
| `activeTab` | To read the address of the tab you clicked the icon on |
| `clipboardWrite` | To put the cleaned link on your clipboard |
| `storage` | To keep the settings and the count listed above |
| `declarativeNetRequestWithHostAccess` | For Auto-clean: lets the browser remove tracking parameters from an address before the page loads. It does nothing on any site until you allow access to all sites |
| `tabs` (optional) | To read the addresses of your other open tabs for **Copy all open tabs**. You can decline it, or remove it later in your browser's extension settings; copying the current tab still works |
| Access to all sites (optional) | For Auto-clean, asked for when you turn it on and given back when you turn it off. You can decline it; everything else still works |

## Contact

Questions about this policy:
[open an issue](https://github.com/anti-racist/TinyTools_GetCleanURL/issues).

## Changes

If this policy changes, the new version will be posted here with a new date.
