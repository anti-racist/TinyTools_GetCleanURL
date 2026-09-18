// Pure URL cleaning. Deliberately free of any chrome.* API so it can run
// unchanged in the popup and under `node --test`.

import {
    globalTrackingParams,
    amazonTrackingParams,
    trackingPrefixes,
    trackingHash,
    amazonDomains,
    productPathMarkers,
    asinPattern
} from './rules.js';

// Match the host exactly or as a subdomain, never as a substring.
function isAmazonHost(hostname) {
    return amazonDomains.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
    );
}

// Collapse a product URL to its canonical /dp/<ASIN> form.
//
// The identifier is only recognised directly after a marker segment such as
// /dp/ or /gp/product/. Matching the bare pattern anywhere in the path also
// caught store fronts (/stores/page/A1B2C3D4E5) and wish lists
// (/hz/wishlist/ls/1A2B3C4D5E) and rewrote them into a different, wrong
// product link.
function amazonProductPath(pathParts) {
    for (let i = 1; i < pathParts.length; i++) {
        if (productPathMarkers.has(pathParts[i - 1]) && asinPattern.test(pathParts[i])) {
            return '/dp/' + pathParts[i];
        }
    }
    return null;
}

function isTrackingParam(key, onAmazon) {
    if (globalTrackingParams.has(key)) return true;
    if (onAmazon && amazonTrackingParams.has(key)) return true;
    return key.startsWith('utm_') || trackingPrefixes.test(key);
}

export function cleanUrl(urlString) {
    try {
        const url = new URL(urlString);
        let changed = false;
        let removedCount = 0;

        const onAmazon = isAmazonHost(url.hostname);

        if (onAmazon) {
            const productPath = amazonProductPath(url.pathname.split('/').filter(Boolean));

            if (productPath) {
                if (productPath !== url.pathname) {
                    url.pathname = productPath;
                    changed = true;
                    removedCount++;
                }
                // Product URLs carry nothing useful in query or fragment.
                if (url.search || url.hash) {
                    url.search = '';
                    url.hash = '';
                    changed = true;
                    removedCount++;
                }
                return { url: url.toString(), changed, removedCount };
            }
            // Any other Amazon page keeps its path. Truncating it to the first
            // few segments dropped real pages, turning /gp/help/customer/
            // display.html into /gp/help/customer.
        }

        if (url.search) {
            const kept = new URLSearchParams();
            let removedAny = false;

            for (const [key, value] of new URLSearchParams(url.search)) {
                if (isTrackingParam(key, onAmazon)) {
                    removedAny = true;
                    removedCount++;
                } else {
                    kept.append(key, value);
                }
            }

            if (removedAny) {
                url.search = kept.toString();
                changed = true;
            }
        }

        if (url.hash && trackingHash.test(url.hash)) {
            url.hash = '';
            changed = true;
            removedCount++;
        }

        return { url: url.toString(), changed, removedCount };
    } catch (error) {
        throw new Error('Invalid URL format', { cause: error });
    }
}
