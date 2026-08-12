import { useEffect, useRef } from 'react'

/**
 * Cinematic canvas "aerial drone" ambience for the hero —
 * a slow drift over a glowing night bazaar: tent rows with fairy lights,
 * floating embers, occasional fireworks. Autoplay / loop / muted by nature.
 */
export default function HeroCanvas({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let W = 0, H = 0
    const DPR = Math.min(2, window.devicePixelRatio || 1)

    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight
      canvas.width = W * DPR; canvas.height = H * DPR
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // tent rows (aerial perspective: small far away, large near)
    interface Tent { x: number; y: number; s: number; hue: number }
    const tents: Tent[] = []
    for (let row = 0; row < 5; row++) {
      const y = 0.30 + row * 0.16
      const n = 7 + row * 2
      for (let i = 0; i < n; i++) {
        tents.push({ x: (i + 0.5) / n + (row % 2 ? 0.03 : -0.03), y, s: 0.5 + row * 0.35, hue: 38 + Math.random() * 10 })
      }
    }
    // embers
    const embers = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 2 + 0.5,
      vy: 0.0004 + Math.random() * 0.001, vx: (Math.random() - 0.5) * 0.0003, tw: Math.random() * Math.PI * 2,
    }))
    // fireworks
    interface Spark { x: number; y: number; vx: number; vy: number; life: number; col: string }
    let sparks: Spark[] = []
    let nextBurst = 120

    const gold = (a: number) => `rgba(255, 200, 110, ${a})`

    const draw = (t: number) => {
      // night sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#0a0812')
      sky.addColorStop(0.55, '#171019')
      sky.addColorStop(1, '#2b1a0e')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // stars
      ctx.fillStyle = 'rgba(255,240,210,0.5)'
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 97.13) % 1) * W
        const sy = ((i * 61.7) % 1) * H * 0.35
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t / 900 + i))
        ctx.globalAlpha = tw * 0.6
        ctx.fillRect(sx, sy, 1.4, 1.4)
      }
      ctx.globalAlpha = 1

      // ground haze
      const hz = ctx.createRadialGradient(W / 2, H * 1.1, H * 0.1, W / 2, H * 1.1, H)
      hz.addColorStop(0, 'rgba(255,170,80,0.20)')
      hz.addColorStop(1, 'rgba(255,170,80,0)')
      ctx.fillStyle = hz
      ctx.fillRect(0, 0, W, H)

      const drift = (t / 40000) % 1 // slow drone drift
      // tents with fairy lights
      tents.forEach((tn, idx) => {
        let x = (tn.x - drift * 0.12 * tn.s) % 1.1
        if (x < -0.05) x += 1.1
        const px = x * W
        const py = tn.y * H
        const s = tn.s * H * 0.09
        // glow
        const g = ctx.createRadialGradient(px, py, 0, px, py, s * 2.4)
        g.addColorStop(0, `hsla(${tn.hue}, 90%, 60%, ${0.20 * tn.s})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.fillRect(px - s * 2.4, py - s * 2.4, s * 4.8, s * 4.8)
        // canopy (triangle, aerial-ish)
        ctx.beginPath()
        ctx.moveTo(px, py - s * 0.75)
        ctx.lineTo(px - s, py + s * 0.55)
        ctx.lineTo(px + s, py + s * 0.55)
        ctx.closePath()
        ctx.fillStyle = `hsla(40, 30%, ${88 - tn.s * 14}%, ${0.10 + tn.s * 0.12})`
        ctx.fill()
        ctx.strokeStyle = gold(0.25 * tn.s)
        ctx.lineWidth = 1
        ctx.stroke()
        // fairy light dots along edges
        const flick = 0.6 + 0.4 * Math.sin(t / 300 + idx * 1.7)
        for (let k = 0; k <= 6; k++) {
          const fx = px - s + (2 * s * k) / 6
          const fy = py + s * 0.55
          ctx.beginPath()
          ctx.arc(fx, fy, 1.3 * tn.s * flick + 0.4, 0, Math.PI * 2)
          ctx.fillStyle = gold(0.75 * flick)
          ctx.fill()
        }
        for (let k = 1; k <= 4; k++) {
          const fx = px - s + (s * k) / 4
          const fy = py + s * 0.55 - (s * 1.3 * k) / 4
          ctx.beginPath()
          ctx.arc(fx, fy, 1.1 * tn.s * flick + 0.3, 0, Math.PI * 2)
          ctx.fillStyle = gold(0.6 * flick)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(px + (s * k) / 4, fy, 1.1 * tn.s * flick + 0.3, 0, Math.PI * 2)
          ctx.fillStyle = gold(0.6 * flick)
          ctx.fill()
        }
      })

      // embers rising
      embers.forEach((e) => {
        e.y -= e.vy; e.x += e.vx
        if (e.y < -0.05) { e.y = 1.05; e.x = Math.random() }
        const a = 0.35 + 0.35 * Math.sin(t / 500 + e.tw)
        ctx.beginPath()
        ctx.arc(e.x * W, e.y * H, e.r, 0, Math.PI * 2)
        ctx.fillStyle = gold(Math.max(0.05, a))
        ctx.fill()
      })

      // fireworks
      if (--nextBurst <= 0) {
        nextBurst = 200 + Math.random() * 260
        const bx = 0.15 + Math.random() * 0.7, by = 0.08 + Math.random() * 0.2
        const cols = ['255,200,110', '255,160,90', '255,230,170']
        const col = cols[Math.floor(Math.random() * cols.length)]
        for (let i = 0; i < 42; i++) {
          const ang = (Math.PI * 2 * i) / 42
          const sp = 0.0018 + Math.random() * 0.0022
          sparks.push({ x: bx, y: by, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, col })
        }
      }
      sparks = sparks.filter((s) => s.life > 0)
      sparks.forEach((s) => {
        s.x += s.vx; s.y += s.vy; s.vy += 0.000006; s.life -= 0.008
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, 1.5 * s.life + 0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${s.col},${Math.max(0, s.life) * 0.85})`
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} className={`h-full w-full ${className}`} aria-hidden />
}
