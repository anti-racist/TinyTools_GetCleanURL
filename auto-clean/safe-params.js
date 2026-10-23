// The names the automatic cleaner removes on every site.
//
// Only the tracking parameters that are safe everywhere: each is on both
// AdGuard's and ClearURLs' global lists or is a utm_ name, and none means
// anything to the page it lands on. Site rules (Amazon, LinkedIn, ...) are
// left to Get Clean URL's one click, where a wrong guess is seen and undone
// by the person who clicked; here a wrong guess would quietly break a page.
//
// build.mjs checks every name against Get Clean URL's own rules, so nothing
// can be stripped here that the click would keep.
export const safeParams = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
    'fbclid', 'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
    'gad_source', 'gad_campaignid', 'srsltid', 'msclkid',
    'mc_cid', 'mc_eid', 'igshid', 'twclid', 'ttclid', 'li_fat_id', 'yclid',
    '_hsenc', '_hsmi', 'mkt_tok'
];
