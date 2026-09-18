// Tracking-parameter and domain rules. Data only - no logic lives here.

// Amazon's own affiliate and session parameters. Several of these - `tag`,
// `ref`, `th`, `psc`, `camp`, `creative`, `smid` - are ordinary query
// parameters on other sites, so they are only ever stripped on Amazon.
export const amazonTrackingParams = new Set([
    'tag', 'ref', 'ref_', 'refRID', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg',
    'pf_rd_p', 'pf_rd_r', 'pf_rd_s', 'pf_rd_t', 'pf_rd_i', 'pf_rd_m',
    '_encoding', 'smid', 'th', 'psc', 'linkId', 'linkCode', 'camp',
    'creative', 'creativeASIN', 'ascsubtag', 'asc_refurl', 'asc_campaign'
]);

// Stripped everywhere. Deliberately excludes `ref`, `referrer` and `source`:
// all three carry real meaning on common sites (a git ref, a document source)
// and removing them rewrites the link rather than cleaning it.
export const trackingParams = {
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
        'yclid', 'ocid', '_hsenc', '_hsmi',
        'zanpid', 'icid', 'mpid', 'ysclid', 's_kwcid', 'trk', 'trkCampaign', 'trkContact',
        'ga_cid', 'pk_campaign', 'pk_kwd', 'vero_conv'
    ]
};

// Flattened once at module load rather than rebuilt on every call.
export const globalTrackingParams = new Set(Object.values(trackingParams).flat());

// Prefixed families that no explicit list can enumerate.
export const trackingPrefixes = /^(fb_|pk_|ref_|sc_)/;


export const amazonDomains = [
    'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it',
    'amazon.es', 'amazon.ca', 'amazon.com.mx', 'amazon.com.br', 'amazon.cn',
    'amazon.co.jp', 'amazon.in', 'amazon.com.au', 'amazon.ae', 'amazon.sa',
    'amazon.nl', 'amazon.se', 'amazon.pl', 'amazon.sg', 'amazon.tr'
];

// A product identifier is only trusted directly after one of these segments:
// /dp/<ASIN>, /gp/product/<ASIN>, /gp/aw/d/<ASIN>.
export const productPathMarkers = new Set(['dp', 'product', 'd']);

// Amazon product identifier: ten uppercase alphanumerics.
export const asinPattern = /^[A-Z0-9]{10}$/;
