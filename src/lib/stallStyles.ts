import type { StallStatus } from '@/lib/store'

/** Brand-aligned package colors: warm cream, gold, sage, rose, and earthy neutrals. */
export const PKG_COLOR: Record<string, { fill: string; stroke: string; label: string }> = {
  premium:  { fill: '#f0dfac', stroke: '#b98a2f', label: 'Premium Tent' },
  standard: { fill: '#eee5d2', stroke: '#8b7656', label: 'Standard Tent' },
  sharing:  { fill: '#dce7d8', stroke: '#6f8d6a', label: 'Standard Sharing Tent' },
  tabler:   { fill: '#eadbd6', stroke: '#a36f66', label: 'Table Space' },
  branding: { fill: '#f5e5b8', stroke: '#c18e2f', label: 'Brand Spot' },
  open_air: { fill: '#dce8e2', stroke: '#668b7e', label: 'Open Air Stall' },
  custom:   { fill: '#e9e5dc', stroke: '#81796d', label: 'Custom Package' },
}

export const NEUTRAL = { fill: '#e9e5dc', stroke: '#81796d', label: 'Unassigned' }

/** Status colors remain high-contrast while matching the warm TCV visual system. */
export const STATUS_STYLE: Record<StallStatus, { stroke: string; label: string; dot: string; overlay: string | null }> = {
  available: { stroke: '#6f9c68', label: 'Available', dot: '#6f9c68', overlay: null },
  reserved:  { stroke: '#b98a2f', label: 'Reserved', dot: '#b98a2f', overlay: 'rgba(185,138,47,0.32)' },
  pending:   { stroke: '#9a8062', label: 'Pending', dot: '#9a8062', overlay: 'rgba(154,128,98,0.28)' },
  booked:    { stroke: '#746d63', label: 'Booked', dot: '#746d63', overlay: 'rgba(116,109,99,0.45)' },
  blocked:   { stroke: '#28231b', label: 'Blocked', dot: '#28231b', overlay: 'rgba(40,35,27,0.55)' },
  sold:      { stroke: '#b44f43', label: 'Sold', dot: '#b44f43', overlay: 'rgba(180,79,67,0.35)' },
}

export function stallColors(pkgId: string, overrideColor?: string | null) {
  const base = PKG_COLOR[pkgId] ?? NEUTRAL
  if (overrideColor) return { fill: overrideColor + '33', stroke: overrideColor, label: base.label }
  return base
}
