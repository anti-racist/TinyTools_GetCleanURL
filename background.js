// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getTabInfo") {
        // Add timeout handling
        const timeoutDuration = 5000; // 5 seconds timeout
        let hasResponded = false;
        
        const timeoutId = setTimeout(() => {
            if (!hasResponded) {
                hasResponded = true;
                sendResponse({error: true, message: "Operation timed out. Please try again."});
            }
        }, timeoutDuration);

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (hasResponded) return; // Don't proceed if timeout occurred
            
            if (tabs.length === 0) {
                hasResponded = true;
                clearTimeout(timeoutId);
                sendResponse({error: true, message: "No active tab found"});
                return;
            }
            
            const tab = tabs[0];
            const url = tab.url;
            
            try {
                const cleanedUrl = cleanUrl(url);
                hasResponded = true;
                clearTimeout(timeoutId);
                sendResponse({
                    url: cleanedUrl.url,
                    changed: cleanedUrl.changed,
                    removedCount: cleanedUrl.removedCount
                });
            } catch (error) {
                hasResponded = true;
                clearTimeout(timeoutId);
                sendResponse({error: true, message: "Error processing URL: " + error.message});
            }
        });
        
        return true;
    }
});

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
        'zanpid', 'icid', 'mpid'
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

        // Fast Amazon domain check using Set
        const isAmazonDomain = Array.from(amazonDomains).some(domain => url.hostname.includes(domain));
        
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
            } else {
                // Optimize non-product page handling
                const relevantParts = pathParts.filter((part, index) => 
                    index < 3 || essentialAmazonPaths.has(part)
                );
                
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
