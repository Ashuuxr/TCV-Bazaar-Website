import { useEffect } from "react";
import { Outlet, useLocation } from "@/lib/router-compat";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useHydrated } from "@/lib/use-hydrated";
import { useApplyTheme } from "@/components/Theme";
import { useSyncStallsFromCloud, useSyncSiteContent } from "@/lib/useCloudSync";
import { useApplyBrand } from "@/lib/useApplyBrand";
import { useServerFn } from "@tanstack/react-start";
import { recordAnalyticsEvent } from "@/lib/analytics.functions";

export default function PublicLayout() {
  useApplyTheme();
  useApplyBrand();
  useSyncStallsFromCloud();
  useSyncSiteContent();
  const { pathname } = useLocation();
  const recordEvent = useServerFn(recordAnalyticsEvent);
  // Refetch cloud CMS content on every SPA navigation so the newest content
  // shows even if Realtime dropped or the tab was never blurred.
  useEffect(() => {
    const w = window as unknown as { __tcvRefetchSiteContent?: () => void };
    w.__tcvRefetchSiteContent?.();
  }, [pathname]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let sessionId = window.sessionStorage.getItem("tcv-analytics-session");
    if (!sessionId) {
      sessionId = `${crypto.randomUUID()}-${Date.now()}`;
      window.sessionStorage.setItem("tcv-analytics-session", sessionId);
    }
    try {
      void Promise.resolve(
        recordEvent({
          data: { eventName: "page_view", path: pathname, sessionId },
        }),
      ).catch((error) => {
        console.warn("[analytics] page view failed", error);
      });
    } catch (error) {
      console.warn("[analytics] page view unavailable", error);
    }
  }, [pathname, recordEvent]);
  const hydrated = useHydrated();
  if (!hydrated) {
    return <div className="min-h-screen" style={{ background: "#faf7f1" }} />;
  }
  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
