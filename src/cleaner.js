// Pure URL cleaning. Deliberately free of any chrome.* API so it can run
// unchanged in the popup and under `node --test`.

import {
    globalTrackingParams,
    amazonTrackingParams,
    trackingPrefixes,
    amazonTrackingPrefixes,
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

// Strip tracking keys out of a fragment without discarding the fragment
// itself. A plain anchor (#ref_section_3) or a hash route (#/dashboard) is a
// link target, not tracking; v1.4 matched a substring and deleted the lot.
function cleanFragment(hash, onAmazon) {
    const raw = hash.slice(1);

    // Hash routes and plain anchors are left exactly as they are.
    if (raw.startsWith('/') || !raw.includes('=')) return { hash, removed: 0 };

    const kept = new URLSearchParams();
    let removed = 0;

    for (const [key, value] of new URLSearchParams(raw)) {
        if (isTrackingParam(key, onAmazon)) {
            removed++;
        } else {
            kept.append(key, value);
        }
    }

    if (removed === 0) return { hash, removed: 0 };

    const remaining = kept.toString();
    return { hash: remaining ? '#' + remaining : '', removed };
}

function isTrackingParam(key, onAmazon) {
    if (globalTrackingParams.has(key)) return true;
    if (key.startsWith('utm_') || trackingPrefixes.test(key)) return true;
    return onAmazon
        && (amazonTrackingParams.has(key) || amazonTrackingPrefixes.test(key));
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

        if (url.hash) {
            const fragment = cleanFragment(url.hash, onAmazon);
            if (fragment.removed > 0) {
                url.hash = fragment.hash;
                changed = true;
                removedCount += fragment.removed;
            }
        }

        return { url: url.toString(), changed, removedCount };
    } catch (error) {
        throw new Error('Invalid URL format', { cause: error });
    }
}
