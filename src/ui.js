// Popup rendering. Pure DOM work - no chrome.* calls, no URL logic.

export function createRenderer(urlDisplayElement, messageElement) {
    function displayMessage(text, type) {
        messageElement.innerHTML = '';
        messageElement.className = type;

        if (type === 'info') {
            const textContainer = document.createElement('div');
            textContainer.className = 'message-text';

            const mainText = document.createElement('div');
            mainText.textContent = 'Copied: URL already clean';

            textContainer.appendChild(mainText);
            messageElement.appendChild(textContainer);
        } else if (type === 'success' && text.includes('(')) {
            const textContainer = document.createElement('div');
            textContainer.className = 'message-text';

            const parts = text.split(/(\([^)]+\))/);

            const mainText = document.createElement('div');
            mainText.textContent = parts[0].trim();

            const subText = document.createElement('div');
            subText.textContent = parts[1];
            subText.style.opacity = '0.9';

            textContainer.appendChild(mainText);
            textContainer.appendChild(subText);
            messageElement.appendChild(textContainer);
        } else if (type === 'error') {
            const textContainer = document.createElement('div');
            textContainer.className = 'message-text error-message';

            const errorIcon = document.createElement('span');
            errorIcon.textContent = '⚠️';
            errorIcon.className = 'error-icon';

            const errorText = document.createElement('span');
            errorText.textContent = text;

            textContainer.appendChild(errorIcon);
            textContainer.appendChild(errorText);
            messageElement.appendChild(textContainer);
        } else {
            messageElement.textContent = text;
        }
    }

    function displayUrl(url) {
        urlDisplayElement.textContent = url.length > 300 ? url.substring(0, 297) + '...' : url;
        urlDisplayElement.title = url;
    }

    function displayStatus(text) {
        urlDisplayElement.textContent = text;
    }

    return { displayMessage, displayUrl, displayStatus };
}
