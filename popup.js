// Organize tracking parameters by category
const trackingParams = {
    amazon: [
        'tag', 'ref', 'ref_', 'refRID', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg',
        'pf_rd_p', 'pf_rd_r', 'pf_rd_s', 'pf_rd_t', 'pf_rd_i', 'pf_rd_m',
        '_encoding', 'smid', 'th', 'psc', 'linkId', 'linkCode', 'camp',
        'creative', 'creativeASIN', 'ascsubtag', 'asc_refurl', 'asc_campaign'
    ],
    google: [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'gclid', 'gclsrc', 'dclid'
    ],
    microsoft: ['msclkid'],
    social: [
        'fbclid', 'igshid', 'cmpid', 'twclid', 'tblci'
    ],
    email: [
        'vero_id', 'email_id', 'email_campaign', 'email_source', 'email_placement',
        'mc_cid', 'mc_eid'
    ],
    other: [
        'ref', 'referrer', 'source', 'yclid', 'ocid', '_hsenc', '_hsmi',
        'zanpid', 'icid', 'mpid', 'ysclid', 's_kwcid', 'trk', 'trkCampaign', 'trkContact',
        'ga_cid', 'pk_campaign', 'pk_kwd', 'vero_conv'
    ]
};

// Amazon domains worldwide - Convert to Set for O(1) lookup
const amazonDomains = new Set([
    'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it',
    'amazon.es', 'amazon.ca', 'amazon.com.mx', 'amazon.com.br', 'amazon.cn',
    'amazon.co.jp', 'amazon.in', 'amazon.com.au', 'amazon.ae', 'amazon.sa',
    'amazon.nl', 'amazon.se', 'amazon.pl', 'amazon.sg', 'amazon.tr'
]);

// Essential Amazon path components - Convert to Set for O(1) lookup
const essentialAmazonPaths = new Set(['gp', 'product', 'dp', 'stores', 'deals']);

// Function to clean tracking parameters from URLs
function cleanUrl(urlString) {
    try {
        const url = new URL(urlString);
        let changed = false;
        let removedCount = 0;

        // Match hostname exactly or as a subdomain, not as a substring
        const isAmazonDomain = Array.from(amazonDomains).some(domain =>
            url.hostname === domain || url.hostname.endsWith('.' + domain)
        );

        if (isAmazonDomain) {
            // Optimize Amazon URL cleaning
            const pathParts = url.pathname.split('/').filter(Boolean);

            // Fast ASIN check - most common pattern for Amazon products
            const asinPattern = /^[A-Z0-9]{10}$/;
            const asinPart = pathParts.find(part => asinPattern.test(part));

            if (asinPart) {
                // Direct ASIN found - fastest path
                const newPath = '/dp/' + asinPart;
                if (newPath !== url.pathname) {
                    url.pathname = newPath;
                    changed = true;
                    removedCount++;
                }
                // Always remove query and hash for Amazon product URLs
                if (url.search || url.hash) {
                    url.search = '';
                    url.hash = '';
                    changed = true;
                    removedCount++;
                }
                return {
                    url: url.toString(),
                    changed,
                    removedCount
                };
            } else {
                // Optimize non-product page handling: keep the first 3 segments,
                // then keep extending only while segments remain contiguous and essential
                // (a gap must stop the run, or the joined path would skip real segments)
                const relevantParts = pathParts.slice(0, 3);
                for (let i = 3; i < pathParts.length; i++) {
                    if (essentialAmazonPaths.has(pathParts[i])) {
                        relevantParts.push(pathParts[i]);
                    } else {
                        break;
                    }
                }

                if (relevantParts.length > 0) {
                    const newPath = '/' + relevantParts.join('/');
                    if (newPath !== url.pathname) {
                        url.pathname = newPath;
                        changed = true;
                        removedCount++;
                    }
                }
            }

            // Early return for Amazon URLs if no query parameters
            if (!url.search && !url.hash) {
                return { url: url.toString(), changed, removedCount };
            }
        }

        // Get all tracking parameters to check - do this only if we have search params
        if (url.search) {
            const allTrackingParams = Object.values(trackingParams).flat();
            const params = new URLSearchParams(url.search);

            // Batch process parameters for better performance
            const paramsToKeep = new URLSearchParams();
            let hasChanges = false;

            for (const [key, value] of params.entries()) {
                if (!(allTrackingParams.includes(key) ||
                    key.startsWith('utm_') ||
                    /^(fb_|pk_|ref_|sc_).*$/.test(key))) {
                    paramsToKeep.append(key, value);
                } else {
                    hasChanges = true;
                    removedCount++;
                }
            }

            if (hasChanges) {
                url.search = paramsToKeep.toString();
                changed = true;
            }
        }

        // Quick hash check
        if (url.hash && /ref_|utm_|_ref/.test(url.hash)) {
            url.hash = '';
            changed = true;
            removedCount++;
        }

        return {
            url: url.toString(),
            changed,
            removedCount
        };
    } catch (error) {
        console.error("Error cleaning URL:", error);
        throw new Error("Invalid URL format");
    }
}

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
        chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
            if (!tabs.length || !tabs[0].url) {
                urlDisplayElement.textContent = "No URL available";
                displayMessage("No valid URL found. Try reloading the page.", "error");
                return;
            }

            const tabUrl = tabs[0].url;

            try {
                const cleaned = cleanUrl(tabUrl);

                // Trim long URLs for display
                const displayUrl = cleaned.url.length > 300 ? cleaned.url.substring(0, 297) + '...' : cleaned.url;
                urlDisplayElement.textContent = displayUrl;
                urlDisplayElement.title = cleaned.url; // Add full URL as tooltip

                const success = await copyToClipboard(cleaned.url);
                if (success) {
                    if (cleaned.changed) {
                        displayMessage(`Copied: URL cleaned (${cleaned.removedCount} tracking parameter${cleaned.removedCount !== 1 ? 's' : ''} removed)`, "success");
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
