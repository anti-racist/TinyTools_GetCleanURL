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
    // A fully qualified name (www.amazon.com.) is the same host, and it
    // otherwise slipped past every site rule with its tracking intact.
    let candidate = hostname.endsWith('.') ? hostname.slice(0, -1) : hostname;
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

    // URLSearchParams strips one leading '?' before parsing, so it is set
    // aside here and put back in front of whatever survives.
    const lead = raw.startsWith('?') ? '?' : '';
    const { kept, removed } = filterParams(raw.slice(lead.length), rule);

    if (removed === 0) return { hash, removed: 0 };

    return { hash: kept ? '#' + lead + kept : '', removed };
}

// Drop the tracking pairs from a query or fragment string and return the rest
// exactly as it arrived.
//
// Only the key is decoded, and only to compare it. The surviving pairs are
// copied through byte for byte: re-serialising them through URLSearchParams
// rewrote every kept parameter - %20 became +, /a/b became %2Fa%2Fb, ?debug
// became ?debug=, a #!/route hash was percent-encoded into a dead link, and a
// GBK-encoded search term (Baidu's ?ie=gbk&wd=%C4%E3) was decoded as UTF-8
// and came back as U+FFFD replacement characters.
function filterParams(raw, rule) {
    const kept = [];
    let removed = 0;

    for (const segment of raw.split('&')) {
        if (!segment) continue;
        // One segment parsed on its own gives exactly the key URLSearchParams
        // gives for it in the full string. The leading '&' stops a segment
        // that happens to start with '?' from having it stripped.
        const [key] = new URLSearchParams('&' + segment).keys();
        if (isTrackingParam(key, rule)) {
            removed++;
        } else {
            kept.push(segment);
        }
    }

    return { kept: kept.join('&'), removed };
}

// Schemes that can carry a link worth sharing. Everything else a tab can hold
// is browser furniture - chrome://, edge://, vivaldi://, about:, an extension
// page - whose address is of no use to anyone it is sent to.
//
// An allowlist rather than a list of browser schemes to block: that list
// differs per browser and anything missing from it would leave the bug in
// place there.
const SHAREABLE_SCHEMES = new Set(['http:', 'https:', 'file:']);

export function isShareable(urlString) {
    try {
        return SHAREABLE_SCHEMES.has(new URL(urlString).protocol);
    } catch {
        return false;
    }
}

// A local file. Shareable on its own - it means something on the machine it
// came from - but deliberately kept out of a bulk copy; see src/batch.js.
export function isLocalFile(urlString) {
    try {
        return new URL(urlString).protocol === 'file:';
    } catch {
        return false;
    }
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

        // Credentials in the address (https://user:pass@host/) are never
        // something to hand on: the link works without them, and pasting it
        // anywhere would publish them. Not counted as a tracking parameter.
        if (url.username || url.password) {
            url.username = '';
            url.password = '';
            changed = true;
        }

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
            const { kept, removed } = filterParams(url.search.slice(1), rule);

            if (removed > 0) {
                // The explicit '?' is the one the setter strips, so a kept
                // pair that itself starts with '?' keeps it.
                url.search = kept ? '?' + kept : '';
                changed = true;
                removedCount += removed;
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
