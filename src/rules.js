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
        'gbraid', 'wbraid', 'gad_source', 'srsltid',
        // gad_campaignid is the campaign number Google Ads started adding
        // beside gad_source in 2025. _gl is the Google tag's cross-domain
        // linker: a client ID and timestamp carried from one site to the
        // next. Both are stripped by AdGuard with no site exceptions, and _gl
        // by ClearURLs as well.
        //
        // _ga, the older linker, is deliberately absent: AdGuard makes an
        // exception for it on AliExpress sign-in, so it is not harmless
        // everywhere.
        'gad_campaignid', '_gl'
    ],
    // msockid is added by Bing results and by Edge: the browser's MUID
    // cookie, 32 hex digits. Neither AdGuard nor ClearURLs lists it. Tested
    // on a Verizon page: the server returned the same bytes without it, and
    // the page's canonical link leaves it out.
    microsoft: ['msclkid', 'msockid'],
    social: [
        'fbclid', 'igshid', 'cmpid', 'twclid', 'tblci',
        'ttclid', 'li_fat_id', 'epik', 'rdt_cid'
    ],
    email: [
        'vero_id', 'email_id', 'email_campaign', 'email_source', 'email_placement',
        'mc_cid', 'mc_eid', 'mkt_tok',
        // MailerLite's subscriber identifiers.
        'ml_subscriber', 'ml_subscriber_hash',
        // Klaviyo's _kx is the subscriber's identity, which Klaviyo's site
        // script reads to recognise them; bxid carries the same profile ID
        // that utm_klaviyo_id does beside it. Salesforce Marketing Cloud's
        // sfmc_sub is the subscriber number. Each one names who the email
        // was sent to, not what the page is. Tested on Muji and
        // Bloomingdale's email links: the same page without them.
        '_kx', 'bxid', 'sfmc_sub'
    ],
    other: [
        'yclid', 'ocid', '_hsenc', '_hsmi',
        'zanpid', 'icid', 'mpid', 'ysclid', 's_kwcid', 'trk', 'trkCampaign', 'trkContact',
        'ga_cid', 'pk_campaign', 'pk_kwd', 'vero_conv',
        // HubSpot's visitor cookies copied into the link, beside the _hsenc
        // and _hsmi above.
        '__hstc', '__hssc', '__hsfp',
        // Stripped globally by both AdGuard and ClearURLs, with no AdGuard
        // exception for any site.
        'hsCtaTracking', '_openstat', 'rb_clickid', 's_cid', 'wickedid',
        // On ClearURLs' global list: Echobox, which news sites use to post to
        // social media, and two email tags (Mailchimp's mc_tc).
        'Echobox', 'mc_tc', 'tracking_source'
    ],
    // The coverage pass of 2.3: names on AdGuard's global list, each named
    // there for a tracking vendor and with no AdGuard exception on any site.
    // Held back: names ordinary enough to mean something elsewhere (janet,
    // ftag, eurl, btag, gci, maf, awc, taid, x-source, link_source, adfrom,
    // recommended_by, int_*), and every name AdGuard exempts somewhere (_ga,
    // elq*, cuid, a8, tduid, oly_* and the rest).
    affiliate: [
        'pjclid', 'x-clickref', 'x-a-medium', 'ranMID', 'ranEAID', 'ranSiteID',
        'tgclid', 'bance_xuid', 'winflncrtag', 'vs_campaign_id',
        'adsterra_clid', 'adsterra_placement_id', 'loclid', 'cstrackid',
        'cjdata', 'cjevent', 'sscid', 'rtkcid', 'irgwc',
        'ir_campaignid', 'ir_adid', 'ir_partnerid', 'asgtbndr', 'famad_xuid',
        'admitad_uid', 'aiad_clid', 'bemobdata', 'jmtyClId', 'Tcsack',
        'oprtrack', 'fbadid', 'nb_placement', 'nb_expid_meta', 'nx_source',
        '_zucks_suid'
    ],
    // LINE and Yahoo! JAPAN ads, AD EBiS.
    japan: [
        'ldtag_cl', 'lt_r', 'srclt', '_ly_c', '_ly_r', 'yj_r', 'line_uid',
        'adc_publisher', 'adc_token', 'uzcid', 'beyond_uzcvid',
        'beyond_uzmcvid', '_bdadid', 'ebisAdID',
        'ebisOther1', 'ebisOther2', 'ebisOther3', 'ebisOther4', 'ebisOther5'
    ],
    // App-install attribution: MyTracker, AppsFlyer, Adjust, Branch.
    apps: [
        'mt_click_id', 'mt_network', 'mt_campaign', 'mt_adset', 'mt_creative',
        'mt_medium', 'mt_sub1', 'mt_sub2', 'mt_sub3', 'mt_sub4', 'mt_sub5',
        'mt_link_id',
        'af_xp', 'af_ad', 'af_adset', 'af_click_lookback', 'af_force_deeplink',
        'is_retargeting',
        'adj_label', 'adj_campaign', 'adj_creative', 'gps_adid',
        'unicorn_click_id', 'adjust_creative', 'adjust_tracker_limit',
        'adjust_tracker', 'adjust_adgroup', 'adjust_campaign',
        'adjust_referrer', 'external_click_id',
        '_branch_referrer', '_branch_match_id'
    ],
    // Email and SMS platforms: Blueshift, Emarsys, Mindbox, Triple Whale and
    // others that put the recipient into the link.
    messaging: [
        'eml-name', 'eml-mediaplan', 'eml-publisher', '_bhlid',
        'ems_dl', 'emcs_t', 'mindbox-click-id', 'mindbox-message-key',
        'tw_medium', 'tw_profile_id', 'tw_source',
        'bsft_clkid', 'bsft_eid', 'bsft_mid', 'bsft_uid', 'bsft_aaid', 'bsft_ek',
        'sms_click', 'sms_source', 'sms_uph', 'user_email_address'
    ],
    // Analytics suites' campaign tags.
    analytics: [
        'at_campaign', 'at_campaign_type', 'at_creation', 'at_emailtype',
        'at_link', 'at_link_id', 'at_link_origin', 'at_link_type',
        'at_medium', 'at_ptr_name', 'at_recipient_id', 'at_recipient_list',
        'at_send_date', 'xtor', 'wt_mc', 'cm_me', 'cm_cr',
        'adobe_mc_ref', 'adobe_mc_sdid', 'clckid', 'ym_tracking_id',
        'itm_source', 'itm_medium', 'itm_campaign', 'itm_content', 'itm_term',
        'dpg_source', 'dpg_campaign', 'dpg_medium', 'dpg_content',
        '_sgm_campaign', '_sgm_term', '_sgm_pinned', '_sgm_source', '_sgm_action',
        'personaclick_search_query', 'personaclick_input_query',
        'cx_click', 'cx_recsOrder', 'cx_recsWidget',
        'vsm_type', 'vsm_cid', 'vsm_pid', '__io_lv', '_io_session_id',
        '_clde', '_cldee', 'analytics_context', 'spot_im_redirect_source',
        'usqp',
        // Yahoo's consent redirect and Facebook's share dialog.
        'guccounter', 'guce_referrer', 'guce_referrer_sig',
        'action_object_map', 'action_ref_map', 'action_type_map'
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
// `cm_mmc` is Coremetrics' marketing campaign family (cm_mmc, cm_mmca1 ...
// cm_mmca15), which AdGuard strips everywhere.
export const trackingPrefixes = /^(fb_|pk_|hsa_|mtm_|cm_mmc)/;

// --- Amazon -----------------------------------------------------------------

// Amazon's own affiliate and session parameters. Several of these - `tag`,
// `ref`, `th`, `psc`, `camp`, `creative`, `smid` - are ordinary query
// parameters on other sites, so they are only ever stripped on Amazon.
const amazonParams = new Set([
    'tag', 'ref', 'ref_', 'refRID', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg',
    'pf_rd_p', 'pf_rd_r', 'pf_rd_s', 'pf_rd_t', 'pf_rd_i', 'pf_rd_m',
    '_encoding', 'smid', 'th', 'psc', 'linkId', 'linkCode', 'camp',
    'creative', 'creativeASIN', 'ascsubtag', 'asc_refurl', 'asc_campaign',
    // What a search results page adds beside the query `k`: crid is a search
    // session ID, qid the time of the search, and sprefix what had been typed
    // when a suggestion was picked. Both lists strip qid; crid and sprefix are
    // in ClearURLs' Amazon search rules. Tested: a search link without them
    // gives the same results in the same order.
    'crid', 'sprefix', 'qid'
]);

// Scoped for the same reason as the list above: `ref_` and `sc_` are Amazon
// conventions, and stripping them off-Amazon removes parameters that mean
// something else there.
const amazonPrefixes = /^(ref_|sc_)/;

const amazonDomains = [
    'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it',
    'amazon.es', 'amazon.ca', 'amazon.com.mx', 'amazon.com.br', 'amazon.cn',
    'amazon.co.jp', 'amazon.in', 'amazon.com.au', 'amazon.ae', 'amazon.sa',
    'amazon.nl', 'amazon.se', 'amazon.pl', 'amazon.sg', 'amazon.tr',
    // Amazon's Turkish store is amazon.com.tr; the amazon.tr entry above
    // never matched it, so Turkish links kept their affiliate tags.
    'amazon.com.tr', 'amazon.com.be', 'amazon.eg'
];

// Off product pages Amazon puts its click tracking in the path rather than the
// query: /ref=nav_logo, /gp/bestsellers/toys-and-games/ref=zg_bs_nav_0. That
// segment is dropped wherever it appears, as ClearURLs does on every Amazon
// URL. Tested: amazon.com/ref=nav_logo without it is the same home page.
const amazonPathTracking = /^ref=/i;

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

// `si` is a different value every time the same video is shared, so it can
// only be identifying the share rather than describing the video.
//
// `feature` names the way the video was reached - youtu.be, shared,
// player_embedded - never which video it is or where it starts. A youtu.be
// share link redirects to /watch?v=...&feature=youtu.be, so it turned up on
// a real link. ClearURLs strips it on YouTube. Tested: the same video plays
// without it.
//
// `pp` is what a video opened from search results carries: base64 holding the
// search itself, word for word, so a shared link tells whoever opens it what
// was searched for. On both lists. Tested: the same video plays without it.
const youtubeParams = new Set(['si', 'feature', 'pp']);

// `t` is deliberately absent above. On YouTube it is the playback timestamp
// (?t=43s), so removing it would break a "start at 0:43" link - while on X the
// same name is a tracking token, stripped below. The same name means
// opposite things on the two sites, so neither rule can be global.

const spotifyParams = new Set(['si']);

// `igshid` is already stripped everywhere; `igsh` is the newer, shorter name
// Instagram switched to and nothing else uses.
const instagramParams = new Set(['igsh']);

// `s` and `t` come from the Share sheet, `ref_src` and `ref_url` from embedded
// timelines. The `ref_` prefix belongs to Amazon, so these two need naming.
//
// `cn` is a share-campaign token on X's links; ClearURLs strips it there.
const twitterParams = new Set(['s', 't', 'cn', 'ref_src', 'ref_url']);

const facebookParams = new Set(['mibextid']);

// What Reddit's Share button appends: a different value every time the same
// post is shared, like YouTube's `si`. ClearURLs strips it on Reddit. Far too
// ordinary a name to strip anywhere else.
//
// solution, js_challenge and jsc_token are added by Reddit's bot check when it
// redirects back to the page that was asked for: a one-time token, not part of
// the page. Tested: the link without them is the link that was opened.
const redditParams = new Set(['share_id', 'solution', 'js_challenge', 'jsc_token']);

// --- Walmart ----------------------------------------------------------------

// A product page is /ip/<name>/<item id>, or /ip/<item id>. Colour and size
// each have their own item id, so the path alone is the product. Tested: a
// link from Google Shopping (?wl13=...&wmlspartner=...&selectedSellerId=0&
// veh=seo_sll&cn=...) opens the same product, colour, size and price with its
// query removed, and so does every other colour and size tried.
function walmartProductPath(pathParts) {
    if (pathParts[0] !== 'ip') return null;
    const last = pathParts.length - 1;
    if (last < 1 || last > 2 || !/^\d+$/.test(pathParts[last])) return null;
    return '/' + pathParts.join('/');
}

// Off product pages only what ClearURLs (u1, ath*) and AdGuard (from) strip on
// Walmart.
const walmartParams = new Set(['u1', 'from']);
const walmartPrefixes = /^ath/;

// Bing puts nine parameters beside the query. Taken:
//
//   cvid   a GUID identifying the search session. Results come from `q`, and
//          the page is unchanged without it.
//   FORM   which entry point the search came from - QBRE is the search box.
//          Pure attribution.
//   sk, sp, sc, qs
//          how the query was picked from the autocomplete list: its
//          position, the suggestion count and type. ClearURLs strips them on
//          Bing, and qp as well, which has not been seen on a real link.
//          Results pages only (/search, /images/search, ...): on Bing Maps
//          `sp` is the pushpin, and without it a shared map loses its place.
//
// Left alone: pq, which carries what was typed before autocomplete finished
// and is the clearest leak of the lot, but is on neither list; and ghc, lq.
//
// Scoped to Bing, FORM especially: matching folds case, so a global rule
// would take `form=` off every site that has one.
const bingParams = new Set(['cvid', 'FORM']);
const bingSearchParams = new Set(['sk', 'sp', 'sc', 'qs']);

// --- eBay -------------------------------------------------------------------

// What a search result adds to an item link (/itm/<item id>):
//
//   _skw      the search that found the item
//   itmmeta   an opaque ID of the results page it was clicked from
//   itmprp    an encoded record of the click
//   hash      an item and image hash beside the ID already in the path
//
// AdGuard strips all four on eBay, and ClearURLs strips hash as well. Tested
// on two items: the same listing and price without them.
//
// `var` is deliberately kept: it is the variant chosen, and without it the
// listing opens on its default variant. AdGuard took its own eBay rule for it
// out for the same reason.
const ebayParams = new Set(['_skw', 'itmmeta', 'itmprp', 'hash']);

const ebayDomains = [
    'ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.it', 'ebay.es',
    'ebay.ca', 'ebay.com.au', 'ebay.at', 'ebay.ch', 'ebay.ie', 'ebay.nl',
    'ebay.be', 'ebay.pl', 'ebay.com.sg', 'ebay.com.my', 'ebay.ph', 'ebay.com.hk'
];

// --- Target -----------------------------------------------------------------

// What a Google Shopping ad adds to a product page (/p/<name>/-/A-<id>), on
// top of the gclid family that is already stripped everywhere. AdGuard strips
// every one of these on target.com except sid, which arrived empty. Tested: a
// product page reached from an ad opens with the same product, price and
// pickup store without any of them.
//
// Product pages only. ref, network, device and location are ordinary words,
// and Target's search and account pages are not where they were seen.
const targetParams = new Set([
    'sid', 'ref', 'AFID', 'fndsrc', 'DFA', 'CPNG', 'adgroup', 'LID',
    'network', 'device', 'location'
]);

// --- Email links ------------------------------------------------------------

// Bloomingdale's sends email through Salesforce Marketing Cloud, which adds its link-tracking
// set - j (job), l (list), u (link), mid (account), jb (batch) - beside the
// subscriber number. cm_ven, cm_cat, cm_pla and cm_ite are Coremetrics'
// campaign tags, uid and smtrctid the subscriber again, and the mi_ family
// belongs to Movable Ink, which builds the email's images. Tested: a product
// link from an email opens the same product with only ID left.
//
// Every one of these but the cm_ names is far too short or ordinary to strip
// anywhere else, so the row covers this one store. Macy's is the same company,
// but a Macy's link seen so far carried none of these, so it is not included.
const bloomingdalesParams = new Set([
    'j', 'l', 'u', 'mid', 'jb', 'cm_ven', 'cm_cat', 'cm_pla', 'cm_ite',
    'uid', 'smtrctid'
]);
const bloomingdalesPrefixes = /^mi_/;

// Muji's email links add campaign_medium and a recommendation engine's
// _su_rec and _su_rec_id beside the utm_ set: a long encoded token and a
// per-click ID. Tested: the same collection, in the same sort order, without
// them. sort_by is kept.
const mujiParams = new Set(['campaign_medium']);
const mujiPrefixes = /^_su_rec/;

// Yelp's email links (sent through Braze) add nid and ytl_, both the same
// 32-hex-digit value: who the email went to. Tested: the same search, in the
// same place, without them. find_desc and find_loc are the search and kept.
//
// dd_referrer carries the page the visitor came from (a Google search, in the
// link tested); on neither list. Tested: the same business page without it.
const yelpParams = new Set(['nid', 'ytl_', 'dd_referrer']);

// --- Social, news and streaming ----------------------------------------------

// What each site's Share button, newsletter or app adds. Every row was tested
// on a real link: the same video, post, article, episode or song without these.

// TikTok video pages, /@<user>/video/<id>. is_from_webapp, sender_device and
// web_id were on the link; the rest are what AdGuard and ClearURLs strip on
// the same pages. `q` and `t` are left alone: on TikTok's search pages they
// are the search.
const tiktokParams = new Set([
    'is_from_webapp', 'sender_device', 'web_id', '_r', '_t', '_d', 'u_code',
    'share_app_id', 'share_app_name', 'share_author_id', 'share_iid',
    'share_link_id', 'share_region', 'social_share_type', 'tt_from', 'ug_btm',
    'embed_source', 'enter_method', 'referer_url', 'referer_video_id',
    'sec_user_id', 'user_id', 'timestamp', 'preview_pb', 'trackParams'
]);

// Threads' Share button adds xmt (AdGuard strips it there), and sometimes
// slof, which is on neither list but arrived beside it.
const threadsParams = new Set(['xmt', 'slof']);

// LinkedIn's emails add trk* (already stripped everywhere as trk, and here as
// a family: trkEmail, trkInfo), lipi, trackingId, refId and the original
// referrer, all on AdGuard's list for LinkedIn. Tested on a job-alert link:
// the same job without trk, refId and trackingId. currentJobId and the rest
// of a job link are kept.
//
// midToken, midSig and eid identify the recipient and the email they came in.
// On neither list; tested on a LinkedIn email's help-page link, which opens the
// same page without them (lang is kept). otpToken, seen beside them once on a
// link whose page no longer exists, is left alone until a working link shows
// the same.
const linkedinParams = new Set([
    'lipi', 'trackingId', 'refId', 'originalReferer', 'original_referer',
    'midToken', 'midSig', 'eid'
]);
const linkedinPrefixes = /^trk/;

// The New York Times: smid is the Share button's (tw-share, url-share), the
// others its newsletters' (AdGuard). unlocked_article_code is the gift that
// opens a paywalled article, and is kept. The Athletic adds `source` as well;
// that name is stripped only there.
const nytimesParams = new Set(['smid', 'sgrp', 'referringSource', 'impression_id']);
const nytimesAthleticParams = new Set(['source']);

// BBC: comScore's ns_* family on social and newsletter links (AdGuard), and
// AT Internet's at_* (ClearURLs). xtor and ocid are stripped everywhere.
const bbcPrefixes = /^(ns_|at_)/;

// Netflix: trackId and tctx record which row and which button a title was
// played from (both lists). The title is the path. jbv - a title id on the
// browse page - is kept, though ClearURLs' jb* would take it.
const netflixParams = new Set(['trackId', 'tctx']);

// Apple Music: at and ct are Apple's affiliate and campaign tokens, itscg and
// itsct its marketing-tools tags, app which app to open (all on a list);
// uo, ls, lId, cId, sr and src came from a Linkfire link beside them. i is
// the song on an album page and is kept, as is mt.
const appleMusicParams = new Set([
    'at', 'ct', 'itscg', 'itsct', 'app', 'uo', 'ls', 'lId', 'cId', 'sr', 'src'
]);

// The Wall Street Journal's Share button adds reflink; AdGuard strips mod (the
// spot on WSJ's own pages a link was clicked) as well. `st` is kept: it is the
// share token that lets someone without a subscription read the article.
const wsjParams = new Set(['reflink', 'mod']);

// Bloomberg's newsletters add sref (tested), and AdGuard strips in_source,
// srnd and leadSource beside it.
const bloombergParams = new Set(['sref', 'in_source', 'srnd', 'leadSource']);

// Best Buy product pages, /site/<name>/<sku>.p. Impact's irclickid, the
// affiliate's ref and loc, and acampID (both lists); irgwc and mpid are
// stripped everywhere. skuId is kept, and so is intl, which without it sends
// the visitor back to the country picker.
const bestbuyParams = new Set(['irclickid', 'ref', 'loc', 'acampID']);

// --- More shops and Medium -------------------------------------------------

// What a search result adds to a product page on each of these. Each row is
// limited to product pages and was tested on a real link from a search: the
// same product, variant and price without these.

// Etsy, /listing/<id>/<name>. ga_* (ClearURLs strips it everywhere) and ref
// (AdGuard, on Etsy) describe the search; click_key, click_sum and
// organic_search_click are on the lists but were not on the link. The rest
// are on neither list; they arrived on the same click and were tested with it.
const etsyParams = new Set([
    'ls', 'ref', 'sr_prefetch', 'pf_from', 'frs', 'bes', 'sts', 'plkey',
    'click_key', 'click_sum', 'organic_search_click'
]);
const etsyPrefixes = /^ga_/;

// Shein, /<name>-p-<id>.html. src_module, src_tab_page_id and mallCode are
// AdGuard's.
const sheinParams = new Set([
    'imgRatio', 'detailBusinessFrom', 'src_identifier', 'src_module',
    'src_tab_page_id', 'mallCode', 'pageListType'
]);

// AliExpress, /item/<id>.html. spm and algo_pvid are on both lists, the rest
// on AdGuard's but pdp_ext_f, which arrived beside them.
const aliexpressParams = new Set([
    'spm', 'algo_pvid', 'algo_exp_id', 'pdp_ext_f', 'pdp_npi',
    'curPageLogUid', 'utparam-url'
]);

// Temu, /<name>-g-<id>.html. All AdGuard's but search_key, the search typed.
const temuParams = new Set([
    'top_gallery_url', 'spec_gallery_id', 'refer_page_sn', 'refer_page_el_sn',
    'refer_page_name', 'refer_page_id', 'freesia_scene', 'search_key'
]);
const temuPrefixes = /^(_oak_|_x_)/;

// Medium's Copy link button adds ?source=copy_link. Both lists strip `source`
// on Medium; it is far too ordinary a name to strip anywhere else.
const mediumParams = new Set(['source']);

// --- Google Search ----------------------------------------------------------

// What Google attaches to a results page on top of the query. None of these
// changes the results: the page is rebuilt from `q`, `udm`, `tbm`, `tbs`, `hl`
// and the rest, which are all kept.
//
//   ved, ei, sei       click and session identifiers
//   sxsrf              a token carrying a timestamp
//   oq                 what was typed before autocomplete finished - the
//                      same leak as Bing's `pq`, but here documented as such
//   gs_*               autocomplete telemetry (gs_lcrp, gs_lp, gs_ssp, ...)
//   aqs, sourceid,     how the search was started: omnibox statistics, the
//   sclient, rlz       browser, the search box, a distribution promo code
//   sca_esv, sca_upv,  opaque per-session values
//   iflsig, fbs, uact
//   mstk, csuir, mtid  AI Mode conversation state. Tested: the same AI Mode
//                      link opened without them, in a fresh window, still
//                      loads AI Mode and answers the question in `q` - and
//                      the page then adds a fresh set of all three itself.
//
// Every one of these is also stripped by ClearURLs, and ei, ved, sxsrf and
// sclient are what search-API documentation says to drop before sharing.
//
// Deliberately kept:
//   biw, bih, dpr      viewport size. AdGuard stripped biw/bih and broke AI
//                      Mode and Lens, which demand them back.
//   ie                 the query's character encoding. Without it a non-UTF-8
//                      query is read wrongly.
//   udm, aep           AI Mode's mode switch; without them the link opens an
//                      ordinary results page.
//   lns_mode, zx       not yet tested the way the AI Mode tokens were, and a
//                      guess is not evidence.
//   client, source, sa too ordinary to prove harmless.
const googleSearchParams = new Set([
    'ved', 'ei', 'sei', 'sxsrf', 'oq', 'aqs', 'sourceid', 'sclient', 'rlz',
    'sca_esv', 'sca_upv', 'iflsig', 'fbs', 'uact', 'mstk', 'csuir', 'mtid'
]);

const googleSearchPrefixes = /^gs_/;

// --- The site table ---------------------------------------------------------

// Each row carries the parameters and prefixes that count as tracking only on
// that site, and optionally a canonicalPath() and a path.
//
// path, when present, limits the row to pages whose path it matches; anywhere
// else on the site the row does not apply at all.
//
// within, when present, adds names that count as tracking only on the pages
// whose path it matches; elsewhere on the site the row's own names still do.
//
// pathTracking, when present, matches whole path segments that are tracking
// rather than part of the page; each one found is dropped from the path.
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
        pathTracking: amazonPathTracking,
        canonicalPath: amazonProductPath
    },
    { id: 'youtube',   domains: ['youtube.com', 'youtu.be'], params: youtubeParams },
    { id: 'spotify',   domains: ['spotify.com'],             params: spotifyParams },
    { id: 'instagram', domains: ['instagram.com'],           params: instagramParams },
    { id: 'twitter',   domains: ['twitter.com', 'x.com'],    params: twitterParams },
    { id: 'facebook',  domains: ['facebook.com'],            params: facebookParams },
    { id: 'reddit',    domains: ['reddit.com'],              params: redditParams },
    {
        id: 'tiktok',
        domains: ['tiktok.com'],
        params: tiktokParams,
        path: /^\/@[^/]+\/video\/\d+/
    },
    { id: 'threads',  domains: ['threads.com', 'threads.net'], params: threadsParams },
    { id: 'linkedin', domains: ['linkedin.com'], params: linkedinParams, prefixes: linkedinPrefixes },
    {
        id: 'nytimes',
        domains: ['nytimes.com'],
        params: nytimesParams,
        within: { path: /^\/athletic\//, params: nytimesAthleticParams }
    },
    { id: 'bbc',      domains: ['bbc.com', 'bbc.co.uk'], prefixes: bbcPrefixes },
    { id: 'netflix',  domains: ['netflix.com'], params: netflixParams },
    { id: 'applemusic', domains: ['music.apple.com'], params: appleMusicParams },
    { id: 'wsj',       domains: ['wsj.com'], params: wsjParams },
    { id: 'bloomberg', domains: ['bloomberg.com'], params: bloombergParams },
    { id: 'bestbuy',   domains: ['bestbuy.com'], params: bestbuyParams, path: /^\/site\/.*\.p$/ },
    {
        id: 'bing',
        domains: ['bing.com'],
        params: bingParams,
        within: { path: /\/search$/, params: bingSearchParams }
    },
    {
        id: 'walmart',
        domains: ['walmart.com'],
        params: walmartParams,
        prefixes: walmartPrefixes,
        canonicalPath: walmartProductPath
    },
    {
        id: 'bloomingdales',
        domains: ['bloomingdales.com'],
        params: bloomingdalesParams,
        prefixes: bloomingdalesPrefixes
    },
    { id: 'muji', domains: ['muji.us', 'muji.com'], params: mujiParams, prefixes: mujiPrefixes },
    { id: 'yelp', domains: ['yelp.com'],            params: yelpParams },
    { id: 'etsy',   domains: ['etsy.com'], params: etsyParams, prefixes: etsyPrefixes, path: /^\/listing\// },
    { id: 'shein',  domains: ['shein.com', 'shein.co.uk'], params: sheinParams, path: /-p-\d+\.html$/ },
    {
        id: 'aliexpress',
        domains: ['aliexpress.us', 'aliexpress.com'],
        params: aliexpressParams,
        path: /^\/item\//
    },
    { id: 'temu',   domains: ['temu.com'], params: temuParams, prefixes: temuPrefixes, path: /-g-\d+\.html$/ },
    { id: 'medium', domains: ['medium.com'], params: mediumParams },
    { id: 'ebay',      domains: ebayDomains,   params: ebayParams,   path: /^\/itm\// },
    { id: 'target',    domains: ['target.com'], params: targetParams, path: /^\/p\// },
    // Results pages only. google.com also serves Docs, Accounts, Mail and
    // Drive, where these names are nobody's business to remove. Google has
    // redirected its country domains to google.com since April 2025, so no
    // country list is needed.
    {
        id: 'google',
        domains: ['google.com'],
        params: googleSearchParams,
        prefixes: googleSearchPrefixes,
        path: /^\/search\/?$/
    }
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
    // The narrower rule is built once here, as the row plus the extra names,
    // so the cleaner only has to pick one of the two.
    if (rule.within) {
        rule.within.rule = {
            ...rule,
            params: new Set([...rule.params, ...fold(rule.within.params)]),
            within: null
        };
    }
    for (const domain of rule.domains) siteRuleByDomain.set(domain, rule);
}
