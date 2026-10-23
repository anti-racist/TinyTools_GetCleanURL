// Site rules the automatic cleaner applies, a few at a time.
//
// Only sites whose rules were tested on real links in Get Clean URL, and
// that Maggie uses every day, so a broken page shows up at once. Each name is
// spelled as the site spells it (Chrome matches names exactly); build.mjs
// checks every one is a name Get Clean URL strips on that site.
//
// `filter` is Chrome's urlFilter syntax: `||linkedin.com` is the site and its
// subdomains; Google's rule is for the results page only, as in Get Clean URL.
export const siteRules = [
    {
        id: 'linkedin',
        filter: '||linkedin.com/',
        sample: 'https://www.linkedin.com/jobs/view/1/',
        names: [
            'lipi', 'trackingId', 'refId', 'originalReferer', 'original_referer',
            'midToken', 'midSig', 'eid', 'rcm',
            // the trk family, a prefix in Get Clean URL
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
            // the gs_ family, a prefix in Get Clean URL
            'gs_lp', 'gs_lcrp', 'gs_ssp', 'gs_l', 'gs_lcp', 'gs_ivs'
        ]
    }
];
