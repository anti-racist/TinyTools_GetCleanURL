// Tracking rules.
//
// Global rules apply on every site. Site-specific rules live in a table keyed
// by registrable domain, so adding a site means adding a row rather than
// threading another flag through the cleaner.

// Stripped everywhere. Deliberately excludes `ref`, `referrer` and `source`:
// all three carry real meaning on common sites (a git ref, a document source)
// and removing them rewrites the link rather than cleaning it.
export const trackingParams = {
    google: [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'gclid', 'gclsrc', 'dclid',
        // gbraid and wbraid are what Google Ads issues where gclid cannot be
        // set; gad_source and srsltid ride along on ad and Shopping clicks.
        'gbraid', 'wbraid', 'gad_source', 'srsltid'
    ],
    microsoft: ['msclkid'],
    social: [
        'fbclid', 'igshid', 'cmpid', 'twclid', 'tblci',
        'ttclid', 'li_fat_id', 'epik', 'rdt_cid'
    ],
    email: [
        'vero_id', 'email_id', 'email_campaign', 'email_source', 'email_placement',
        'mc_cid', 'mc_eid', 'mkt_tok'
    ],
    other: [
        'yclid', 'ocid', '_hsenc', '_hsmi',
        'zanpid', 'icid', 'mpid', 'ysclid', 's_kwcid', 'trk', 'trkCampaign', 'trkContact',
        'ga_cid', 'pk_campaign', 'pk_kwd', 'vero_conv'
    ]
};

// Parameter names are matched case-insensitively, so every name is folded once
// here rather than on every lookup. The lists above keep their natural spelling
// because that is how the vendors document them.
const fold = names => new Set([...names].map(name => name.toLowerCase()));

// Flattened once at module load rather than rebuilt on every call.
export const globalTrackingParams = fold(Object.values(trackingParams).flat());

// Prefixed families that no explicit list can enumerate. Stripped everywhere.
// Deliberately one alternation rather than several patterns: a single regex
// costs the same whatever it holds, while separate regexes cost one test each.
// `mtm_` is Matomo's current name for the family `pk_` used to carry; `hsa_`
// is HubSpot's ads family, a dozen keys that no explicit list would keep up
// with.
export const trackingPrefixes = /^(fb_|pk_|hsa_|mtm_)/;

// --- Amazon -----------------------------------------------------------------

// Amazon's own affiliate and session parameters. Several of these - `tag`,
// `ref`, `th`, `psc`, `camp`, `creative`, `smid` - are ordinary query
// parameters on other sites, so they are only ever stripped on Amazon.
const amazonParams = new Set([
    'tag', 'ref', 'ref_', 'refRID', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg',
    'pf_rd_p', 'pf_rd_r', 'pf_rd_s', 'pf_rd_t', 'pf_rd_i', 'pf_rd_m',
    '_encoding', 'smid', 'th', 'psc', 'linkId', 'linkCode', 'camp',
    'creative', 'creativeASIN', 'ascsubtag', 'asc_refurl', 'asc_campaign'
]);

// Scoped for the same reason as the list above: `ref_` and `sc_` are Amazon
// conventions, and stripping them off-Amazon removes parameters that mean
// something else there.
const amazonPrefixes = /^(ref_|sc_)/;

const amazonDomains = [
    'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it',
    'amazon.es', 'amazon.ca', 'amazon.com.mx', 'amazon.com.br', 'amazon.cn',
    'amazon.co.jp', 'amazon.in', 'amazon.com.au', 'amazon.ae', 'amazon.sa',
    'amazon.nl', 'amazon.se', 'amazon.pl', 'amazon.sg', 'amazon.tr'
];

// A product identifier is only trusted directly after one of these segments:
// /dp/<ASIN>, /gp/product/<ASIN>, /gp/aw/d/<ASIN>.
const productPathMarkers = new Set(['dp', 'product', 'd']);

// Amazon product identifier: ten uppercase alphanumerics.
const asinPattern = /^[A-Z0-9]{10}$/;

// Collapse a product URL to its canonical /dp/<ASIN> form.
//
// The identifier is only recognised directly after a marker segment. Matching
// the bare pattern anywhere in the path also caught store fronts
// (/stores/page/A1B2C3D4E5) and wish lists (/hz/wishlist/ls/1A2B3C4D5E) and
// rewrote them into a different, wrong product link.
function amazonProductPath(pathParts) {
    for (let i = 1; i < pathParts.length; i++) {
        if (productPathMarkers.has(pathParts[i - 1]) && asinPattern.test(pathParts[i])) {
            return '/dp/' + pathParts[i];
        }
    }
    return null;
}

// --- Share buttons ----------------------------------------------------------

// What the Share button on each of these platforms appends. Every name here is
// short and ordinary - `si`, `s`, `t`, `pp` - and means something real on other
// sites, so each is scoped to the site that mints it. Stripping any of them
// globally would rewrite links rather than clean them.

const youtubeParams = new Set(['si', 'pp']);

// `t` is deliberately absent above. On YouTube it is the playback timestamp
// (?t=43s), so removing it would break a "start at 0:43" link - while on X the
// same name is a tracking token, stripped below. One name, opposite meanings:
// this is the case that makes per-site scoping mandatory rather than tidy.

const spotifyParams = new Set(['si']);

// `igshid` is already stripped everywhere; `igsh` is the newer, shorter name
// Instagram switched to and nothing else uses.
const instagramParams = new Set(['igsh']);

// `s` and `t` come from the Share sheet, `ref_src` and `ref_url` from embedded
// timelines. The `ref_` prefix belongs to Amazon, so these two need naming.
const twitterParams = new Set(['s', 't', 'ref_src', 'ref_url']);

const facebookParams = new Set(['mibextid']);

// --- The site table ---------------------------------------------------------

// Each row carries the parameters and prefixes that count as tracking only on
// that site, and optionally a canonicalPath().
//
// canonicalPath(pathParts) returning a path means this URL has one true form
// and everything else on it - query and fragment alike - is noise. Returning
// null means the page keeps its path and is cleaned like any other.
const siteRules = [
    {
        id: 'amazon',
        domains: amazonDomains,
        params: amazonParams,
        prefixes: amazonPrefixes,
        canonicalPath: amazonProductPath
    },
    { id: 'youtube',   domains: ['youtube.com', 'youtu.be'], params: youtubeParams },
    { id: 'spotify',   domains: ['spotify.com'],             params: spotifyParams },
    { id: 'instagram', domains: ['instagram.com'],           params: instagramParams },
    { id: 'twitter',   domains: ['twitter.com', 'x.com'],    params: twitterParams },
    { id: 'facebook',  domains: ['facebook.com'],            params: facebookParams }
];

const NO_PARAMS = new Set();
const NEVER = /(?!)/;

// Prefix patterns are written lowercase and tested against an already-folded
// key, so they need no /i and stay as cheap as they were.

// domain -> rule. Several domains share one rule object, and the lookup in
// cleaner.js walks a hostname's suffixes against this map, so the cost does
// not grow with the number of sites in the table.
export const siteRuleByDomain = new Map();
for (const rule of siteRules) {
    rule.params = rule.params ? fold(rule.params) : NO_PARAMS;
    if (!rule.prefixes) rule.prefixes = NEVER;
    for (const domain of rule.domains) siteRuleByDomain.set(domain, rule);
}
