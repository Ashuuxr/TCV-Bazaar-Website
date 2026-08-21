'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

type ParallaxScrollingProps = {
  image: string
  eyebrow?: string
  title: string
  highlight?: string
  description: string
}

export function ParallaxScrolling({ image, eyebrow = 'A living destination', title, highlight, description }: ParallaxScrollingProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    gsap.registerPlugin(ScrollTrigger)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const layers = root.querySelectorAll<HTMLElement>('[data-parallax-layer]')
    const context = gsap.context(() => {
      if (!reduceMotion) {
        const trigger = root.querySelector<HTMLElement>('[data-parallax-layers]')
        if (trigger) {
          gsap.timeline({
            scrollTrigger: {
              trigger,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.7,
            },
          })
            .to(trigger.querySelector('[data-parallax-layer="1"]'), { yPercent: 18, ease: 'none' }, 0)
            .to(trigger.querySelector('[data-parallax-layer="2"]'), { yPercent: 10, ease: 'none' }, 0)
            .to(trigger.querySelector('[data-parallax-layer="3"]'), { yPercent: -5, ease: 'none' }, 0)
        }

        const lenis = new Lenis()
        const onScroll = () => ScrollTrigger.update()
        const onTick = (time: number) => lenis.raf(time * 1000)
        lenis.on('scroll', onScroll)
        gsap.ticker.add(onTick)
        gsap.ticker.lagSmoothing(0)

        return () => {
          lenis.off('scroll', onScroll)
          lenis.destroy()
          gsap.ticker.remove(onTick)
        }
      }

      gsap.set(layers, { clearProps: 'transform' })
      return undefined
    }, root)

    return () => {
      context.revert()
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger && root.contains(trigger.trigger as Node)) trigger.kill()
      })
    }
  }, [])

  return (
    <section ref={rootRef} className="relative overflow-hidden py-20 sm:py-28" aria-label={title}>
      <div className="container-x">
        <div className="tcv-parallax relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-white/15 bg-[#0d0c0a] shadow-[0_35px_100px_-50px_rgba(217,180,95,.55)] sm:min-h-[42rem]" data-parallax-layers>
          <div className="absolute inset-0" data-parallax-layer="1">
            <img src={image} alt="" loading="lazy" className="h-[116%] w-full object-cover opacity-70" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(5,5,4,.9),rgba(5,5,4,.35)_52%,rgba(5,5,4,.62))]" data-parallax-layer="2" />
          <div className="surface-grid pointer-events-none absolute inset-0 opacity-25" data-parallax-layer="3" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

          <div className="relative z-10 flex min-h-[34rem] max-w-2xl flex-col justify-end p-7 sm:min-h-[42rem] sm:p-14">
            <span className="eyebrow text-white/70">{eyebrow}</span>
            <h2 className="font-display mt-4 text-balance text-4xl font-medium leading-[.98] tracking-[-.04em] text-white sm:text-6xl">
              {title}{' '}
              {highlight && <span className="gold-shimmer">{highlight}</span>}
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">{description}</p>
          </div>

          <div className="glass-liquid pointer-events-none absolute right-6 top-6 hidden rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-white/70 sm:block">
            Move with the moment
          </div>
        </div>
      </div>
    </section>
  )
}
