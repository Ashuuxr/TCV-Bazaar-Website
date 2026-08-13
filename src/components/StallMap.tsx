import { useMemo, useState, type ReactNode } from 'react'
import { useCms } from '@/lib/store'
import type { Stall, StallStatus } from '@/lib/store'
import { STATUS_STYLE, stallColors } from '@/lib/stallStyles'

export { STATUS_STYLE } from '@/lib/stallStyles'

/** Painted background matching the blueprint: road strips, entry banners, walkway planters,
 *  sponsors panel, TCV Carnival footer, and Keshar Towers side. Shared by admin + public map. */
export function LayoutBackground({ children }: { children?: ReactNode }) {
  return (
    <g>
      {/* ROAD strip along the top */}
      <rect x="7.5" y="0" width="107" height="5.5" fill="var(--stall-road)" />
      <line x1="10" y1="2.75" x2="112" y2="2.75" stroke="var(--stall-on-dark)" strokeWidth="0.35" strokeDasharray="2.6 2.4" />
      <text x="61" y="3.9" textAnchor="middle" fill="var(--stall-on-dark)" fontSize="2.6" fontWeight="800" letterSpacing="1.8">ROAD</text>
      {/* Small TCV badge top-right */}
      <rect x="117" y="0" width="15.5" height="5.5" fill="var(--stall-road)" rx="0.5" />
      <text x="124.75" y="3.9" textAnchor="middle" fill="var(--stall-on-dark)" fontSize="2.6" fontWeight="800" letterSpacing="1">TCV</text>

      {/* Left vertical banner — TCV CARNIVAL */}
      <rect x="0" y="6.5" width="7.5" height="46" fill="var(--stall-side)" />
      <text x="3.75" y="29.5" textAnchor="middle" fill="var(--stall-on-dark)" fontSize="2.6" fontWeight="800"
            letterSpacing="1.6" transform="rotate(-90 3.75 29.5)">TCV CARNIVAL</text>

      {/* Right vertical banner — ENTRY */}
      <rect x="132.5" y="6.5" width="7.5" height="46" fill="var(--stall-side)" />
      <text x="136.25" y="29.5" textAnchor="middle" fill="var(--stall-on-dark)" fontSize="2.6" fontWeight="800"
            letterSpacing="1.6" transform="rotate(-90 136.25 29.5)">ENTRY</text>

      {/* Central walkway between the two rows */}
      <rect x="7.5" y="22" width="125" height="19" fill="var(--stall-walkway)" />
      {/* Two large left-pointing walkway arrows */}
      <path d="M55 31.5 L38 31.5 M45 27 L38 31.5 L45 36" stroke="var(--stall-arrow)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M105 31.5 L88 31.5 M95 27 L88 31.5 L95 36" stroke="var(--stall-arrow)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Bottom band: SPONSORS PANEL + small TCV badge on the right */}
      <rect x="7.5" y="54" width="107" height="7" fill="var(--stall-sponsor)" stroke="var(--stall-sponsor-border)" strokeWidth="0.25" />
      <text x="61" y="58.9" textAnchor="middle" fill="var(--stall-footer)" fontSize="2.8" fontWeight="800" letterSpacing="1.4">SPONSORS PANEL</text>
      <rect x="117" y="54" width="15.5" height="7" fill="var(--stall-road)" rx="0.5" />
      <text x="124.75" y="58.9" textAnchor="middle" fill="var(--stall-on-dark)" fontSize="2.6" fontWeight="800" letterSpacing="1">TCV</text>

      {/* KESHAR TOWERS footer */}
      <rect x="0" y="63" width="140" height="10" fill="var(--stall-footer)" />
      <text x="70" y="69.6" textAnchor="middle" fill="var(--stall-on-dark)" fontSize="3.8" fontWeight="800" letterSpacing="2.2">KESHAR TOWERS</text>
      {children}
    </g>
  )
}

export default function StallMap({
  selectable = false,
  selected,
  onSelect,
  filterPkg,
  compact = false,
}: {
  selectable?: boolean
  selected?: string | null
  onSelect?: (stall: Stall) => void
  filterPkg?: string | null
  compact?: boolean
}) {
  const stalls = useCms((s) => s.stalls)
  const packages = useCms((s) => s.packages)
  const [hover, setHover] = useState<Stall | null>(null)
  const [tip, setTip] = useState({ x: 0, y: 0 })

  const visible = useMemo(
    () => stalls.filter((s) => (s.active !== false) && (!filterPkg || s.pkgId === filterPkg)),
    [stalls, filterPkg],
  )
  const pkgById = (id: string) => packages.find((p) => p.id === id)
  const priceOf = (s: Stall) => s.priceOverride ?? pkgById(s.pkgId)?.price ?? 0

  return (
    <div className="relative">
      <svg viewBox="0 0 140 80" preserveAspectRatio="xMidYMid meet"
           className={`w-full rounded-2xl border border-[var(--line)] bg-[var(--card-bg)] shadow-[0_18px_55px_-30px_rgba(78,55,20,.45)] ${compact ? 'max-h-[420px]' : ''}`}>
        <LayoutBackground />
        {visible.map((s) => {
          const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.available
          const col = stallColors(s.pkgId, s.color)
          const isSel = selected === s.id
          const clickable = selectable && s.status === 'available'
          const isHover = hover?.id === s.id
          return (
            <g
              key={s.id}
              onClick={() => { if (clickable && onSelect) onSelect(s) }}
              onMouseMove={(e) => {
                const svg = e.currentTarget.ownerSVGElement as SVGSVGElement
                const rect = svg.getBoundingClientRect()
                setHover(s)
                setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top })
              }}
              onMouseLeave={() => setHover(null)}
              className={clickable ? 'stall-interactive' : undefined}
              style={{ cursor: clickable ? 'pointer' : 'default' }}
            >
              <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="0.8"
                    fill={col.fill} stroke={isSel ? '#b98a2f' : col.stroke}
                    strokeWidth={isSel ? 0.7 : 0.35}
                    style={{ transition: 'all .2s', filter: isHover && clickable ? 'brightness(1.08)' : undefined }} />
              {st.overlay && (
                <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="0.8" fill={st.overlay} pointerEvents="none" />
              )}
              {(() => {
                const isDark = s.status === 'blocked'
                const textFill = isDark ? '#f9fafb' : '#17130c'
                const words = s.label.split(' ')
                if (words.length > 1) {
                  const fs = 1.2
                  const cy = s.y + s.h / 2
                  return (
                    <text x={s.x + s.w / 2} textAnchor="middle" fontSize={fs} fontWeight="700"
                          fill={textFill} style={{ pointerEvents: 'none' }}>
                      {words.map((w, i) => (
                        <tspan key={i} x={s.x + s.w / 2} y={cy - ((words.length - 1) * fs) / 2 + i * (fs + 0.15) + 0.4}>{w}</tspan>
                      ))}
                    </text>
                  )
                }
                const fs = s.label.length >= 3 ? 1.9 : 2.4
                return (
                  <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 0.9}
                        textAnchor="middle" fontSize={fs} fontWeight="700"
                        fill={textFill} style={{ pointerEvents: 'none' }}>
                    {s.label}
                  </text>
                )
              })()}
            </g>
          )
        })}
      </svg>

      {hover && (
        <div
          className="stall-tooltip pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-[var(--line)] bg-[var(--card-bg)] px-3.5 py-2.5 text-xs shadow-xl"
          style={{ left: tip.x, top: tip.y - 12, transform: 'translate(-50%, -100%)' }}
        >
          <div className="font-semibold">Stall {hover.label}{hover.zone ? ` · ${hover.zone}` : ''}</div>
          <div className="text-[var(--ink-soft)]">{pkgById(hover.pkgId)?.name ?? '—'} · ₹{priceOf(hover).toLocaleString('en-IN')}</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: STATUS_STYLE[hover.status].dot }} />
            {STATUS_STYLE[hover.status].label}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--ink-soft)]">
        {(Object.keys(STATUS_STYLE) as StallStatus[]).filter((k) => k !== 'pending').map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUS_STYLE[k].dot }} />
            {STATUS_STYLE[k].label}
          </span>
        ))}
        <span className="ml-auto hidden sm:block">{visible.length === 0 ? 'Loading live stalls…' : `${visible.filter((s) => s.status === 'available').length} of ${visible.length} stalls available`}</span>
      </div>
    </div>
  )
}
