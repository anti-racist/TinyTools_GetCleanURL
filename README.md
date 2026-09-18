# Get Clean URL

A lightweight browser extension that strips tracking parameters from URLs, creating cleaner and safer links for sharing.

---

## What's New

### Version 1.5
- 🐛 **Bug Fix** Restored support for Vivaldi, where the popup had started reporting that no URL was available
- 🐛 **Bug Fix** Ordinary links are no longer over-cleaned — parameters like `tag`, `ref` and `source` are kept on sites where they carry real meaning, and are still stripped on Amazon
- 🐛 **Bug Fix** Amazon store fronts, wish lists and help pages are no longer rewritten into the wrong link
- 🐛 **Bug Fix** Page anchors and in-page links are preserved instead of being dropped
- ✨ **Under the hood** The cleaning logic now has an automated test suite covering more than 600 URLs

### Version 1.4
- 🐛 **Bug Fix** Fixed an intermittent "Could not establish connection" error some users saw when opening the popup
- 🐛 **Bug Fix** Fixed a link-cleaning bug where certain Amazon URLs could be rewritten to an incorrect path

---

## Key Features

- Instantly clean and copy URLs in an easy-to-share format  
- Clear feedback messages so you know exactly what’s happening  
- Improved privacy by stripping tracking information from links  

---

## How to Use

1. Click the extension icon in your browser toolbar  
2. The tool automatically cleans the current link and copies it  
3. Paste the clean link anywhere you want to share it  

---

## Privacy

We do not collect any user data.

---

## Compatibility

Compatible with most Chromium-based browsers, including **Google Chrome**, **Microsoft Edge** and **Vivaldi**.
