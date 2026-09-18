// Pure URL cleaning. Deliberately free of any chrome.* API so it can run
// unchanged in the popup and under `node --test`.

import {
    globalTrackingParams,
    amazonTrackingParams,
    trackingPrefixes,
    trackingHash,
    amazonDomains,
    essentialAmazonPaths,
    asinPattern
} from './rules.js';

// Match the host exactly or as a subdomain, never as a substring.
function isAmazonHost(hostname) {
    return amazonDomains.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
    );
}

// The product identifier, wherever it sits in the path.
function amazonProductPath(pathParts) {
    const asin = pathParts.find(part => asinPattern.test(part));
    return asin ? '/dp/' + asin : null;
}

// Non-product pages: keep the first three segments, then keep extending only
// while segments remain contiguous and essential (a gap must stop the run, or
// the joined path would skip real segments).
function amazonBrowsePath(pathParts) {
    const relevant = pathParts.slice(0, 3);
    for (let i = 3; i < pathParts.length; i++) {
        if (!essentialAmazonPaths.has(pathParts[i])) break;
        relevant.push(pathParts[i]);
    }
    return relevant.length > 0 ? '/' + relevant.join('/') : null;
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
            const pathParts = url.pathname.split('/').filter(Boolean);
            const productPath = amazonProductPath(pathParts);

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

            const browsePath = amazonBrowsePath(pathParts);
            if (browsePath && browsePath !== url.pathname) {
                url.pathname = browsePath;
                changed = true;
                removedCount++;
            }

            if (!url.search && !url.hash) {
                return { url: url.toString(), changed, removedCount };
            }
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
