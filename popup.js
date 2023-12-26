
chrome.runtime.sendMessage({ action: "getTabInfo" }, function (response) {
    const messageDiv = document.getElementById('message');

    if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        messageDiv.textContent = 'Error Occurred';
        messageDiv.style.color = '#e74c3c';
    } else if (response && response.url) {
        const cleanUrl = response.url.split('?')[0];
        const tempInput = document.createElement('input');
        tempInput.value = cleanUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        messageDiv.textContent = 'Copied!';
    } else {
        messageDiv.textContent = 'No URL Detected';
        messageDiv.style.color = '#e74c3c'; 
    }
});
