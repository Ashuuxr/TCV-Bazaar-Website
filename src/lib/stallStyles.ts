import type { StallStatus } from "@/lib/store";

/** Theme-aware package colors. Values resolve from light/dark CSS tokens. */
export const PKG_COLOR: Record<
  string,
  { fill: string; stroke: string; label: string }
> = {
  premium: {
    fill: "var(--stall-premium-fill)",
    stroke: "var(--stall-premium-stroke)",
    label: "Premium Tent",
  },
  standard: {
    fill: "var(--stall-standard-fill)",
    stroke: "var(--stall-standard-stroke)",
    label: "Standard Tent",
  },
  sharing: {
    fill: "var(--stall-sharing-fill)",
    stroke: "var(--stall-sharing-stroke)",
    label: "Standard Sharing Tent",
  },
  tabler: {
    fill: "var(--stall-tabler-fill)",
    stroke: "var(--stall-tabler-stroke)",
    label: "Table Space",
  },
  branding: {
    fill: "var(--stall-branding-fill)",
    stroke: "var(--stall-branding-stroke)",
    label: "Brand Spot",
  },
  open_air: {
    fill: "var(--stall-open-fill)",
    stroke: "var(--stall-open-stroke)",
    label: "Open Air Stall",
  },
  custom: {
    fill: "var(--stall-neutral-fill)",
    stroke: "var(--stall-neutral-stroke)",
    label: "Custom Package",
  },
};

export const NEUTRAL = {
  fill: "var(--stall-neutral-fill)",
  stroke: "var(--stall-neutral-stroke)",
  label: "Unassigned",
};

/** Theme-aware status colors preserve contrast in both modes. */
export const STATUS_STYLE: Record<
  StallStatus,
  { stroke: string; label: string; dot: string; overlay: string | null }
> = {
  available: {
    stroke: "var(--stall-available)",
    label: "Available",
    dot: "var(--stall-available)",
    overlay: null,
  },
  reserved: {
    stroke: "var(--stall-reserved)",
    label: "Reserved",
    dot: "var(--stall-reserved)",
    overlay: "color-mix(in srgb, var(--stall-reserved) 32%, transparent)",
  },
  pending: {
    stroke: "var(--stall-pending)",
    label: "Pending",
    dot: "var(--stall-pending)",
    overlay: "color-mix(in srgb, var(--stall-pending) 28%, transparent)",
  },
  booked: {
    stroke: "var(--stall-booked)",
    label: "Booked",
    dot: "var(--stall-booked)",
    overlay: "color-mix(in srgb, var(--stall-booked) 45%, transparent)",
  },
  blocked: {
    stroke: "var(--stall-blocked)",
    label: "Blocked",
    dot: "var(--stall-blocked)",
    overlay: "color-mix(in srgb, var(--stall-blocked) 55%, transparent)",
  },
  sold: {
    stroke: "var(--stall-sold)",
    label: "Sold",
    dot: "var(--stall-sold)",
    overlay: "color-mix(in srgb, var(--stall-sold) 35%, transparent)",
  },
};

export function stallColors(pkgId: string, overrideColor?: string | null) {
  const base = PKG_COLOR[pkgId] ?? NEUTRAL;
  if (overrideColor)
    return {
      fill: overrideColor + "33",
      stroke: overrideColor,
      label: base.label,
    };
  return base;
}
