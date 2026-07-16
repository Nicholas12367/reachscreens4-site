/* Reach Screens — ad attribution capture.
 *
 * On landing, snapshots the ad tags (UTM params + Meta click id) from the URL
 * and stores them in a 90-day cookie. Attribution is LAST-TOUCH: the most recent
 * ad the visitor clicked wins (that's the ad that drove this conversion). First
 * touch is also kept for reference. Because it only writes when a visit actually
 * carries ad tags, an untagged/organic visit never wipes the attribution.
 *
 * window.__rsAttr() returns the flattened fields to attach to a form submit.
 * main.js spreads them into the /submit payload.
 */
(function () {
  "use strict";

  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var COOKIE = "rs_attr";
  var MAXAGE = 60 * 60 * 24 * 90; // 90 days

  function readCookie(name) {
    var m = document.cookie.match("(?:^|; )" + name + "=([^;]*)");
    return m ? decodeURIComponent(m[1]) : "";
  }

  function writeCookie(name, val) {
    var domain = location.hostname.replace(/^www\./, "");
    document.cookie =
      name + "=" + encodeURIComponent(val) +
      ";max-age=" + MAXAGE + ";path=/;domain=." + domain + ";SameSite=Lax" +
      (location.protocol === "https:" ? ";Secure" : "");
  }

  function parse(raw) { try { return JSON.parse(raw) || {}; } catch (e) { return {}; } }

  function capture() {
    var qs = new URLSearchParams(location.search);
    var fresh = {};
    KEYS.forEach(function (k) { var v = qs.get(k); if (v) fresh[k] = v.slice(0, 200); });
    var fbclid = qs.get("fbclid"); if (fbclid) fresh.fbclid = fbclid.slice(0, 300);

    var store = parse(readCookie(COOKIE));
    if (Object.keys(fresh).length) {
      if (!store.first) {
        store.first = Object.assign(
          { at: new Date().toISOString(),
            landing: location.href.slice(0, 500),
            referrer: (document.referrer || "").slice(0, 500) },
          fresh
        );
      }
      store.last = Object.assign(
        { at: new Date().toISOString(),
          landing: location.href.slice(0, 500),
          referrer: (document.referrer || "").slice(0, 500) },
        fresh
      );
      writeCookie(COOKIE, JSON.stringify(store));
    }
    return store;
  }

  capture();

  // Flattened fields the form + back-end will save. utm_content = ad set name,
  // utm_term = ad name — the two you'll join against Meta for per-ad-set ROI.
  window.__rsAttr = function () {
    var s = parse(readCookie(COOKIE));
    var l = s.last || {}; // last-touch: the most recent ad the visitor clicked
    return {
      utm_source:   l.utm_source   || "",
      utm_medium:   l.utm_medium   || "",
      utm_campaign: l.utm_campaign || "",
      utm_content:  l.utm_content  || "",
      utm_term:     l.utm_term     || "",
      fbclid:       l.fbclid       || "",
      ad_landing:   l.landing      || "",
      ad_referrer:  l.referrer     || "",
      ad_at:        l.at           || "",
      // Human-readable one-liner for the email + CRM badge.
      attribution:  [l.utm_campaign, l.utm_content, l.utm_term].filter(Boolean).join(" › ")
    };
  };
})();
