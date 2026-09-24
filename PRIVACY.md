# Privacy policy: Get Clean URL

Last updated: 24 September 2026

Get Clean URL is a browser extension published by Maggie Mao. This policy
describes what data the extension handles, where that data goes, and how
long it is kept.

## In short

- The developer collects nothing. The extension has no server, no account,
  no analytics and no network code, and its content security policy blocks
  network requests.
- It stores nothing. It reads a link, cleans it, and puts it on your
  clipboard.

## What it handles

| Data | When | Where it goes | How long it is kept |
| --- | --- | --- | --- |
| The address of the tab you are on | When you click the toolbar icon | Cleaned inside the extension's popup, then copied to your clipboard | Not stored. Gone when the popup closes |
| The addresses of all your open tabs | Only when you press **Copy all open tabs**, and only after you allow the optional `tabs` permission | Cleaned inside the popup, then copied to your clipboard as a list | Not stored. Gone when the popup closes |

Tab titles are never read. On browser pages such as settings or a new tab,
the extension does nothing and leaves your clipboard alone.

## What it does not do

- It does not store any data, in your browser or anywhere else.
- It does not send any data to the developer or to anyone else.
- It does not sell data, show ads, or track you across sites.

## Permissions

| Permission | Why |
| --- | --- |
| `activeTab` | To read the address of the tab you clicked the icon on |
| `clipboardWrite` | To put the cleaned link on your clipboard |
| `tabs` (optional) | To read the addresses of your other open tabs for **Copy all open tabs**. Asked for the first time you press the button; single-tab copying works without it |

## Your choices

- Decline the `tabs` permission and only single-tab copying is used.
- Remove the permission at any time from your browser's extension settings.

## Contact

Questions about this policy:
[open an issue](https://github.com/anti-racist/TinyTools_GetCleanURL/issues).

## Changes

If this policy changes, the new version will be posted here with a new date.
