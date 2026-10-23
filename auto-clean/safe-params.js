// The names the automatic cleaner removes on every site.
//
// Every global name in Get Clean URL's own rules (src/rules.js), in the
// spelling the vendors use, plus the documented utm_ names below: Chrome can
// only remove a parameter by its exact name, so the utm_ family that Get
// Clean URL matches as a prefix has to be listed here one by one.
//
// Site rules (Amazon, LinkedIn, ...) are left to Get Clean URL's one click,
// where a wrong guess is seen and undone by the person who clicked; here a
// wrong guess would quietly break a page.
import { trackingParams } from '../src/rules.js';

const utmNames = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'utm_id', 'utm_name', 'utm_source_platform', 'utm_creative_format',
    'utm_marketing_tactic'
];

export const safeParams = [...new Set([...utmNames, ...Object.values(trackingParams).flat()])];
