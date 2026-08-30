import { useEffect, useState } from "react";
import { OFFICIAL_LOGO_URL, useCms } from "@/lib/store";

/**
 * Brand logo — reads from the CMS Brand settings so admin uploads propagate everywhere.
 * `gold` forces the dark/gold variant (e.g. over the dark hero on the home page).
 */
export default function Logo({
  className = "h-11",
  gold = false,
  style,
  useBrandSize = false,
}: {
  className?: string;
  gold?: boolean;
  style?: React.CSSProperties;
  /** When true, header logo height comes from Brand settings instead of className. */
  useBrandSize?: boolean;
}) {
  const mode = useCms((s) => s.theme.mode);
  const brand = useCms((s) => s.brand);
  const site = useCms((s) => s.site);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 640px)");
    const on = () => setIsMobile(q.matches);
    on();
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);

  const useDark = gold || mode === "dark";
  let src = useDark ? brand.logoDark : brand.logoLight;
  if (isMobile && brand.logoMobile) src = brand.logoMobile;
  if (!src || src.includes("/__l5e/assets-v1/")) src = OFFICIAL_LOGO_URL;
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);

  const brandStyle: React.CSSProperties | undefined = useBrandSize
    ? { height: isMobile ? brand.heightMobile : brand.heightDesktop }
    : undefined;

  if (broken || !src) {
    return (
      <span
        className={`inline-flex items-center font-display font-semibold tracking-tight ${className}`}
        style={{
          color: useDark ? "#d9b45f" : "var(--ink)",
          ...brandStyle,
          ...style,
        }}
      >
        TCV Bazaar
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={site.name || "Brand"}
      className={`w-auto object-contain ${className}`}
      style={{ ...brandStyle, ...style }}
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
}
