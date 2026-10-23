// The names the automatic cleaner removes on every site.
//
// Every global name in Get Clean URL's own rules (src/rules.js), in the
// spelling the vendors use, plus the prefix families below spelled out.
//
// Site rules (Amazon, LinkedIn, ...) are left to Get Clean URL's one click,
// where a wrong guess is seen and undone by the person who clicked; here a
// wrong guess would quietly break a page.
import { trackingParams } from '../src/rules.js';

// Get Clean URL also strips whole families by prefix (trackingPrefixes in
// src/rules.js: fb_, pk_, hsa_, mtm_, cm_mmc, and utm_). Chrome cannot match a
// prefix, so each family's documented names are listed here; build.mjs checks
// every one is a name Get Clean URL strips, so this list can only narrow what
// the click does, never widen it.
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

export const safeParams = [...new Set([...prefixFamilies, ...Object.values(trackingParams).flat()])];
