// Pure URL cleaning. Deliberately free of any chrome.* API so it can run
// unchanged in the popup and under `node --test`.

import {
    globalTrackingParams,
    trackingPrefixes,
    siteRuleByDomain
} from './rules.js';

// Find the site rule for a hostname by walking its suffixes:
// www.amazon.co.uk -> amazon.co.uk. This matches a domain exactly or as a
// subdomain and never as a substring, and it costs the same whether the table
// holds one site or a hundred - unlike scanning a list of domains, which costs
// one comparison per entry.
function siteRuleFor(hostname) {
    let candidate = hostname;
    for (;;) {
        const rule = siteRuleByDomain.get(candidate);
        if (rule) return rule;
        const dot = candidate.indexOf('.');
        if (dot === -1) return null;
        candidate = candidate.slice(dot + 1);
    }
}

// Strip tracking keys out of a fragment without discarding the fragment
// itself. A plain anchor (#ref_section_3) or a hash route (#/dashboard) is a
// link target, not tracking; v1.4 matched a substring and deleted the lot.
function cleanFragment(hash, rule) {
    const raw = hash.slice(1);

    // Hash routes and plain anchors are left exactly as they are.
    if (raw.startsWith('/') || !raw.includes('=')) return { hash, removed: 0 };

    const kept = new URLSearchParams();
    let removed = 0;

    for (const [key, value] of new URLSearchParams(raw)) {
        if (isTrackingParam(key, rule)) {
            removed++;
        } else {
            kept.append(key, value);
        }
    }

    if (removed === 0) return { hash, removed: 0 };

    const remaining = kept.toString();
    return { hash: remaining ? '#' + remaining : '', removed };
}

// How many parameters a query or fragment string holds. Used where a whole
// query is discarded at once: counting the operation instead reported "2
// tracking parameters removed" for an Amazon product URL no matter whether it
// carried two or twenty.
function countParams(raw) {
    const text = raw.startsWith('?') ? raw.slice(1) : raw;
    if (!text || text.startsWith('/') || !text.includes('=')) return 0;
    let n = 0;
    for (const _ of new URLSearchParams(text)) n++;
    return n;
}

// `rule` is the site rule for the URL's host, or null off any known site.
//
// Matching is case-insensitive: sites really do mint ?CMP= and ?ICID=, and a
// case-sensitive lookup let every one of them through. Only the comparison is
// folded - a parameter that survives is re-appended under the spelling it
// arrived with, so ?ProductID= never comes back as ?productid=.
function isTrackingParam(key, rule) {
    const name = key.toLowerCase();
    if (globalTrackingParams.has(name)) return true;
    if (name.startsWith('utm_') || trackingPrefixes.test(name)) return true;
    if (!rule) return false;
    return rule.params.has(name) || rule.prefixes.test(name);
}

export function cleanUrl(urlString) {
    try {
        const url = new URL(urlString);
        let changed = false;
        let removedCount = 0;

        const rule = siteRuleFor(url.hostname);

        if (rule && rule.canonicalPath) {
            const canonical = rule.canonicalPath(url.pathname.split('/').filter(Boolean));

            if (canonical) {
                if (canonical !== url.pathname) {
                    // The segments being dropped are the tracking ones -
                    // /Some-Product/.../ref=sr_1_3 - so they count as one
                    // thing removed.
                    url.pathname = canonical;
                    changed = true;
                    removedCount++;
                }
                // A canonical URL carries nothing useful in query or fragment.
                if (url.search || url.hash) {
                    removedCount += countParams(url.search)
                                  + countParams(url.hash.slice(1));
                    url.search = '';
                    url.hash = '';
                    changed = true;
                }
                return { url: url.toString(), changed, removedCount };
            }
            // Any other page on the site keeps its path. Truncating it to the
            // first few segments dropped real pages, turning /gp/help/customer/
            // display.html into /gp/help/customer.
        }

        if (url.search) {
            const kept = new URLSearchParams();
            let removedAny = false;

            for (const [key, value] of new URLSearchParams(url.search)) {
                if (isTrackingParam(key, rule)) {
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
            const fragment = cleanFragment(url.hash, rule);
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
