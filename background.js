chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "getTabInfo") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const tab = tabs[0];
            sendResponse({ url: tab ? tab.url : '' });
        });
        return true;
    }
});
