// Automatic cleaning: the rules Chrome applies to each page's address as it
// opens, before the page loads.
//
// Pure, like cleaner.js: it only builds the rule objects and reads hostnames.
// background.js hands the rules to chrome.declarativeNetRequest.
//
// Chrome removes only names it is given, spelled exactly, so everything here
// is narrower than the click: no prefixes, no case folding, no paths, no
// fragments, and site rules for only a few sites. Every name is one the click
// removes too; the tests check each one against cleanUrl().

import { trackingParams } from './rules.js';

// Get Clean URL strips whole families by prefix (trackingPrefixes in
// rules.js: fb_, pk_, hsa_, mtm_, cm_mmc, and utm_). Chrome cannot match a
// prefix, so each family's documented names are spelled out.
const prefixFamilies = [
    // Google Analytics campaign tags
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'utm_id', 'utm_name', 'utm_source_platform', 'utm_creative_format',
    'utm_marketing_tactic',
    // Facebook share and action tags
    'fb_action_ids', 'fb_action_types', 'fb_ref', 'fb_source', 'fb_comment_id',
    // Matomo (Piwik) campaign tags, old and new names
    'pk_campaign', 'pk_kwd', 'pk_keyword', 'pk_source', 'pk_medium',
    'pk_content', 'pk_cid',
    'mtm_campaign', 'mtm_keyword', 'mtm_source', 'mtm_medium', 'mtm_content',
    'mtm_cid', 'mtm_group', 'mtm_placement',
    // HubSpot ads
    'hsa_acc', 'hsa_cam', 'hsa_grp', 'hsa_ad', 'hsa_src', 'hsa_tgt', 'hsa_kw',
    'hsa_mt', 'hsa_net', 'hsa_ver',
    // Coremetrics marketing campaigns
    'cm_mmc', 'cm_mmca1', 'cm_mmca2', 'cm_mmca3', 'cm_mmca4', 'cm_mmca5',
    'cm_mmca6', 'cm_mmca7', 'cm_mmca8', 'cm_mmca9', 'cm_mmca10'
];

// Chrome compares names case-sensitively, while the click folds case. The
// commonest other spellings - all lower case, all upper case - are listed as
// well, so UTM_SOURCE goes too. A mixed spelling such as Utm_Source stays.
export const spellings = names => [...new Set(names.flatMap(name =>
    [name, name.toLowerCase(), name.toUpperCase()]))];

// Names the click removes everywhere but automatic cleaning leaves: an email
// address or an email's id can be what a verify, sign-in or unsubscribe page
// needs, and automatic cleaning works unseen, on every page.
const clickOnly = new Set(['email_id', 'user_email_address']);

export const globalNames = spellings([...prefixFamilies, ...Object.values(trackingParams).flat()]
    .filter(name => !clickOnly.has(name)));

// Site rules, a few at a time. Automatic cleaning works silently and on every
// page of a site - sign-in, checkout, account - while the click's site rules
// were tested on the pages people share. So only sites tested under automatic
// cleaning are here; the rest stay with the click.
//
// `filter` is Chrome's urlFilter syntax: `||linkedin.com/` is the site and its
// subdomains. Google's rule is for the results page only, as in rules.js.
// `sample` is a page each name is checked against in the tests.
export const autoSiteRules = [
    {
        id: 'linkedin',
        filter: '||linkedin.com/',
        sample: 'https://www.linkedin.com/jobs/view/1/',
        names: [
            'lipi', 'trackingId', 'refId', 'originalReferer', 'original_referer',
            'midToken', 'midSig', 'eid', 'rcm', 'otpToken',
            // the trk family, a prefix in rules.js
            'trk', 'trkEmail', 'trkInfo'
        ]
    },
    {
        id: 'youtube',
        filter: '||youtube.com/',
        sample: 'https://www.youtube.com/watch',
        names: ['si', 'feature', 'pp']
    },
    {
        id: 'youtu.be',
        filter: '||youtu.be/',
        sample: 'https://youtu.be/abc',
        names: ['si', 'feature', 'pp']
    },
    {
        id: 'google-search',
        filter: '||google.com/search?',
        sample: 'https://www.google.com/search',
        names: [
            'ved', 'ei', 'sei', 'sxsrf', 'oq', 'aqs', 'sourceid', 'sclient', 'rlz',
            'sca_esv', 'sca_upv', 'iflsig', 'fbs', 'uact', 'mstk', 'csuir', 'mtid',
            'aep', 'zx',
            // the gs_ family, a prefix in rules.js
            'gs_lp', 'gs_lcrp', 'gs_ssp', 'gs_l', 'gs_lcp', 'gs_ivs'
        ]
    }
];

// The access automatic cleaning asks for when it is turned on, and gives back
// when it is turned off.
export const ALL_SITES = { origins: ['<all_urls>'] };

// Top-level pages only, and only GET: a form posted somewhere is left alone.
const PAGES = { resourceTypes: ['main_frame'], requestMethods: ['get'] };

function redirectRemoving(names) {
    return { type: 'redirect', redirect: { transform: { queryTransform: { removeParams: names } } } };
}

// The rules for Chrome. One global rule on every page with a query, and one
// rule per site above at a higher priority: Chrome carries out one redirect
// per request, the highest priority's, so a site rule removes the global
// names as well as its own. Chrome makes no redirect when nothing is removed.
//
// `excluded` is the person's list of sites to leave alone; each site covers
// its subdomains.
//
// Not one regular expression naming the parameters: Chrome caps a rule's
// regex at a small memory budget, and a pattern naming them went over it.
// Chrome then drops the rule without a word, so the switch said On and
// nothing was cleaned.
export function buildRules(excluded = []) {
    const skip = excluded.length ? { excludedRequestDomains: excluded } : {};
    const global = {
        id: 1,
        priority: 1,
        action: redirectRemoving(globalNames),
        condition: { urlFilter: '?', ...PAGES, ...skip }
    };
    const sites = autoSiteRules.map((site, i) => ({
        id: i + 2,
        priority: 2,
        action: redirectRemoving([...new Set([...globalNames, ...spellings(site.names)])]),
        condition: { urlFilter: site.filter, ...PAGES, ...skip }
    }));
    return [global, ...sites];
}

// What the person typed into the excluded-sites box, as a bare host: no
// scheme, no www., no path or port, lower case. null when it is not a host.
export function normaliseSite(input) {
    let text = String(input || '').trim().toLowerCase();
    if (!text) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//.test(text)) text = 'https://' + text;
    let host;
    try {
        host = new URL(text).hostname;
    } catch {
        return null;
    }
    host = host.replace(/^www\./, '').replace(/\.$/, '');
    // A host with at least one dot and nothing but letters, digits, dots and
    // hyphens (punycode included); an IP address is fine too.
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null;
    return host;
}

// The excluded site a hostname falls under - itself or a parent - or null.
export function excludedBy(hostname, excluded) {
    const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
    return excluded.find(site => host === site || host.endsWith('.' + site)) || null;
}

// Whether a hostname is one of the excluded sites or under one.
export function isExcluded(hostname, excluded) {
    return excludedBy(hostname, excluded) !== null;
}
