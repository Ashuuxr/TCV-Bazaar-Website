import { useEffect } from "react";
import { useCms } from "@/lib/store";

/** Keeps <link rel="icon"> in sync with the admin-managed favicon. */
export function useApplyBrand() {
  const favicon = useCms((s) => s.brand.favicon);
  useEffect(() => {
    if (typeof document === "undefined" || !favicon) return;
    const heads = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'),
    );
    if (heads.length === 0) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = favicon;
      document.head.appendChild(link);
    } else {
      heads.forEach((l) => {
        l.href = favicon;
      });
    }
  }, [favicon]);
}
