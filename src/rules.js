// Tracking-parameter and domain rules. Data only - no logic lives here.

// Grouped by origin purely for readability. NOTE: every group is currently
// flattened into one global set below, so an Amazon-specific entry such as
// `tag` is stripped on every site. That is v1.4 behaviour, preserved here
// deliberately; scoping it is a separate, behaviour-changing commit.
export const trackingParams = {
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

// Flattened once at module load rather than rebuilt on every call.
export const allTrackingParams = new Set(Object.values(trackingParams).flat());

// Prefixed families that no explicit list can enumerate.
export const trackingPrefixes = /^(fb_|pk_|ref_|sc_)/;

// Fragments worth discarding wholesale.
export const trackingHash = /ref_|utm_|_ref/;

export const amazonDomains = [
    'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it',
    'amazon.es', 'amazon.ca', 'amazon.com.mx', 'amazon.com.br', 'amazon.cn',
    'amazon.co.jp', 'amazon.in', 'amazon.com.au', 'amazon.ae', 'amazon.sa',
    'amazon.nl', 'amazon.se', 'amazon.pl', 'amazon.sg', 'amazon.tr'
];

export const essentialAmazonPaths = new Set(['gp', 'product', 'dp', 'stores', 'deals']);

// Amazon product identifier: ten uppercase alphanumerics.
export const asinPattern = /^[A-Z0-9]{10}$/;
