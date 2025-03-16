document.addEventListener('DOMContentLoaded', function() {
    const messageElement = document.getElementById('message');
    const urlDisplayElement = document.getElementById('url-display');
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    function displayMessage(text, type) {
        // Clear previous content
        messageElement.innerHTML = '';
        messageElement.className = type;
        
        if (type === "info") {
            // For "already clean" message - simplified version
            const textContainer = document.createElement('div');
            textContainer.className = 'message-text';
            
            const mainText = document.createElement('div');
            mainText.textContent = 'Copied: URL already clean';
            
            textContainer.appendChild(mainText);
            messageElement.appendChild(textContainer);
        } 
        else if (type === "success" && text.includes('(')) {
            // For "cleaned" message with parameters
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
        }
        else if (type === "error") {
            // For error messages
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
        }
        else {
            // For other messages - simplified approach
            messageElement.textContent = text;
        }
    }

    // Show loading state immediately
    urlDisplayElement.textContent = "Getting URL...";
    
    // Enhanced clipboard function with retry logic
    async function copyToClipboard(text, retryCount = 0) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error(`Clipboard write attempt ${retryCount + 1} failed:`, error);
            
            if (retryCount < MAX_RETRIES) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return copyToClipboard(text, retryCount + 1);
            }
            
            return false;
        }
    }
    
    // Main function to get and clean the URL
    function getAndCleanUrl() {
        chrome.runtime.sendMessage({ action: "getTabInfo" }, async function(response) {
            if (chrome.runtime.lastError) {
                urlDisplayElement.textContent = "Error";
                displayMessage("Extension error: " + chrome.runtime.lastError.message, "error");
                return;
            }

            if (!response || response.error) {
                urlDisplayElement.textContent = "No URL available";
                displayMessage(response?.message || "No valid URL found. Try reloading the page.", "error");
                return;
            }

            try {
                // Validate URL before proceeding
                new URL(response.url);
                
                // Trim long URLs for display
                const displayUrl = response.url.length > 300 ? response.url.substring(0, 297) + '...' : response.url;
                urlDisplayElement.textContent = displayUrl;
                urlDisplayElement.title = response.url; // Add full URL as tooltip

                const success = await copyToClipboard(response.url);
                if (success) {
                    if (response.changed) {
                        displayMessage(`Copied: URL cleaned (${response.removedCount} tracking parameter${response.removedCount !== 1 ? 's' : ''} removed)`, "success");
                    } else {
                        displayMessage("Copied: URL already clean (No changes)", "info");
                    }
                } else {
                    displayMessage("Copy failed! Please check browser permissions and try again.", "error");
                }
            } catch (error) {
                urlDisplayElement.textContent = "Invalid URL";
                displayMessage("The URL is not valid. Please try again.", "error");
            }
        });
    }

    // Execute when popup opens
    getAndCleanUrl();
});
