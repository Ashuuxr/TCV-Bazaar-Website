import type { StallStatus } from '@/lib/store'

/** Per-package base fill/stroke colours. Falls back to a neutral tone. */
export const PKG_COLOR: Record<string, { fill: string; stroke: string; label: string }> = {
  premium:  { fill: '#e9d5ff', stroke: '#7c3aed', label: 'Premium Tent' },
  standard: { fill: '#dbeafe', stroke: '#3b82f6', label: 'Standard Tent' },
  sharing:  { fill: '#d1fae5', stroke: '#10b981', label: 'Standard Sharing Tent' },
  tabler:   { fill: '#fce7f3', stroke: '#ec4899', label: 'Table Space' },
  branding: { fill: '#fef3c7', stroke: '#d97706', label: 'Brand Spot' },
  open_air: { fill: '#ccfbf1', stroke: '#14b8a6', label: 'Open Air Stall' },
  custom:   { fill: '#f3f4f6', stroke: '#6b7280', label: 'Custom Package' },
}

export const NEUTRAL = { fill: '#f3f4f6', stroke: '#9ca3af', label: 'Unassigned' }

export const STATUS_STYLE: Record<StallStatus, { stroke: string; label: string; dot: string; overlay: string | null }> = {
  available: { stroke: 'currentColor', label: 'Available', dot: '#22c55e', overlay: null },
  reserved:  { stroke: '#d69e2e',      label: 'Reserved',  dot: '#d69e2e', overlay: 'rgba(214,158,46,0.35)' },
  pending:   { stroke: '#3b82f6',      label: 'Pending',   dot: '#3b82f6', overlay: 'rgba(59,130,246,0.28)' },
  booked:    { stroke: '#78716c',      label: 'Booked',    dot: '#78716c', overlay: 'rgba(120,113,108,0.45)' },
  blocked:   { stroke: '#1f2937',      label: 'Blocked',   dot: '#1f2937', overlay: 'rgba(31,41,55,0.55)' },
  sold:      { stroke: '#dc2626',      label: 'Sold',      dot: '#dc2626', overlay: 'rgba(220,38,38,0.35)' },
}

export function stallColors(pkgId: string, overrideColor?: string | null) {
  const base = PKG_COLOR[pkgId] ?? NEUTRAL
  if (overrideColor) return { fill: overrideColor + '33', stroke: overrideColor, label: base.label }
  return base
}