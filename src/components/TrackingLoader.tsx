import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  listTrackingIntegrations,
  type PublicTrackingRow,
  type TrackingProvider,
} from "@/lib/tracking.functions";

type Scope = "public" | "admin";

type TrackingWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  oaiq?: (...args: unknown[]) => void;
};

const TAG_ATTR = "data-tcv-tracking";

function removeAll(providerPrefix: string) {
  document
    .querySelectorAll("[" + TAG_ATTR + '^="' + providerPrefix + '"]')
    .forEach((n) => n.remove());
}

function injectExternal(providerKey: string, src: string) {
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  s.setAttribute(TAG_ATTR, providerKey);
  document.head.appendChild(s);
}
function injectInline(providerKey: string, code: string) {
  const s = document.createElement("script");
  s.text = code;
  s.setAttribute(TAG_ATTR, providerKey);
  document.head.appendChild(s);
}
function injectNoscript(providerKey: string, html: string) {
  const n = document.createElement("noscript");
  n.innerHTML = html;
  n.setAttribute(TAG_ATTR, providerKey + ":ns");
  document.body.appendChild(n);
}

function installOpenAiAdsPixel() {
  const w = window as TrackingWindow;
  if (typeof w.oaiq === "function") return;
  const queue = Object.assign(
    (...args: unknown[]) => {
      queue.q.push(args);
    },
    { q: [] as unknown[][] },
  );
  w.oaiq = queue;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
  script.setAttribute(TAG_ATTR, "openai_ads:1XGA53faoQAXcybyMrkWVw");
  document.head.appendChild(script);
  w.oaiq("init", { pixelId: "1XGA53faoQAXcybyMrkWVw", debug: true });
}

function installProvider(row: PublicTrackingRow) {
  installOpenAiAdsPixel();
  const p = row.provider;
  const id = (row.tracking_id ?? "").trim();
  const key = p + ":" + (id || "x");
  removeAll(p + ":");
  switch (p) {
    case "meta_pixel": {
      if (!id) return;
      // Public pages contain a statically rendered Meta Pixel so Meta's Event
      // Setup Tool can discover it from the initial HTML. Reuse that instance
      // instead of injecting a second SDK/bootstrap at runtime.
      // The static public-head script initializes fbq before React mounts.
      // Reuse that queue instead of injecting a second Meta SDK/bootstrap.

      if (
        typeof (window as TrackingWindow).fbq === "function" ||
        document.querySelector('script[data-tcv-meta-pixel-static="true"]')
      ) {
        return;
      }
      // Keep the queue bootstrap, external SDK, and initialization as separate
      // script elements. Meta's Event Setup Tool detects this standard shape
      // more reliably than an inline script that creates the SDK dynamically.
      injectInline(
        key + ":bootstrap",
        "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
      );
      injectExternal(
        key + ":sdk",
        "https://connect.facebook.net/en_US/fbevents.js",
      );
      injectInline(key + ":init", "fbq('init','" + id + "');");
      injectNoscript(
        key,
        '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' +
          id +
          '&ev=PageView&noscript=1"/>',
      );
      return;
    }
    case "ga4":
    case "google_ads": {
      if (!id) return;
      injectExternal(key, "https://www.googletagmanager.com/gtag/js?id=" + id);
      injectInline(
        key,
        "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js', new Date());gtag('config','" +
          id +
          "');",
      );
      return;
    }
    case "gtm": {
      if (!id) return;
      injectInline(
        key,
        "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','" +
          id +
          "');",
      );
      injectNoscript(
        key,
        '<iframe src="https://www.googletagmanager.com/ns.html?id=' +
          id +
          '" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
      );
      return;
    }
    case "clarity": {
      if (!id) return;
      injectInline(
        key,
        '(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","' +
          id +
          '");',
      );
      return;
    }
    case "tiktok": {
      if (!id) return;
      injectInline(
        key,
        '!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};' +
          "ttq.load('" +
          id +
          "');ttq.page();}(window,document,'ttq');",
      );
      return;
    }
    case "linkedin": {
      if (!id) return;
      injectInline(
        key,
        '_linkedin_partner_id="' +
          id +
          '";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s);})(window.lintrk);',
      );
      return;
    }
    case "custom": {
      const code = (row.custom_code ?? "").trim();
      if (!code) return;
      injectInline(key, code);
      return;
    }
  }
}

function firePageView(options: { skipMeta?: boolean } = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!options.skipMeta) {
    try {
      w.fbq?.("track", "PageView");
    } catch {
      /* noop */
    }
  }
  try {
    w.gtag?.("event", "page_view", { page_path: window.location.pathname });
  } catch {
    /* noop */
  }
  try {
    (w.dataLayer = w.dataLayer || []).push({
      event: "gtm.pageview",
      page_path: window.location.pathname,
    });
  } catch {
    /* noop */
  }
  try {
    w.ttq?.page?.();
  } catch {
    /* noop */
  }
  try {
    w.lintrk?.("track");
  } catch {
    /* noop */
  }
}

const META_MAP: Record<string, string> = {
  ViewContent: "view_item",
  Contact: "contact",
  Lead: "generate_lead",
  CompleteRegistration: "sign_up",
  InitiateCheckout: "begin_checkout",
  AddPaymentInfo: "add_payment_info",
  Purchase: "purchase",
};

function fireEvent(name: string, params?: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  try {
    w.fbq?.("track", name, params);
  } catch {
    /* noop */
  }
  if (name === "Lead") {
    try {
      w.oaiq?.("measure", "lead_created", { type: "customer_action" });
    } catch {
      /* noop */
    }
  }
  try {
    w.gtag?.("event", META_MAP[name] ?? name, params);
  } catch {
    /* noop */
  }
  try {
    (w.dataLayer = w.dataLayer || []).push({ event: name, ...(params ?? {}) });
  } catch {
    /* noop */
  }
  try {
    w.ttq?.track?.(name, params);
  } catch {
    /* noop */
  }
}

export default function TrackingLoader({
  scope = "public",
}: {
  scope?: Scope;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const installedRef = useRef<Set<TrackingProvider>>(new Set());

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__tcvTrack = (e: string, p?: Record<string, unknown>) =>
      fireEvent(e, p);
    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).__tcvTrack;
      } catch {
        /* noop */
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const apply = (rows: PublicTrackingRow[]) => {
      installOpenAiAdsPixel();
      const filtered = rows.filter(
        (r) => r.enabled && (scope === "public" || r.load_on_admin),
      );
      const wanted = new Set(filtered.map((r) => r.provider));
      for (const p of installedRef.current) {
        if (!wanted.has(p)) removeAll(p + ":");
      }
      for (const r of filtered) installProvider(r);
      installedRef.current = wanted;
      // Fire one initial view after the provider queues have been installed.
      // Route changes are handled by the pathname effect below.
      // The static root-shell Pixel already emitted the initial PageView.
      // Avoid a duplicate event while still initializing other providers.
      firePageView({
        skipMeta: typeof (window as TrackingWindow).fbq === "function",
      });
    };
    const load = () =>
      listTrackingIntegrations()
        .then((rows) => {
          if (!cancelled) apply(rows);
        })
        .catch(() => {
          /* noop */
        });
    load();
    // Refresh when the tab regains focus so admin changes appear promptly
    // without exposing the tracking table over anonymous Realtime.
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [scope]);

  useEffect(() => {
    // The initial PageView is emitted after integrations load in apply().
    // This effect handles SPA route changes without creating a duplicate
    // initial event before the Meta SDK is ready.
    if (pathname === "/") return;
    const t = setTimeout(() => firePageView(), 50);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
