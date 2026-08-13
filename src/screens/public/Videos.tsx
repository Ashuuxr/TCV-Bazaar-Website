import { useState } from 'react'
import { Play, X } from 'lucide-react'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/Reveal'
import HeroCanvas from '@/components/HeroCanvas'
import { useCms } from '@/lib/store'
import type { VideoItem } from '@/lib/store'

export default function Videos() {
  const videos = useCms((s) => s.videos)
  const [open, setOpen] = useState<VideoItem | null>(null)

  return (
    <div>
      <PageHero eyebrow="Videos" title="Relive the magic" sub="Aftermovies, highlights and behind-the-scenes from past editions." />
      <section className="container-x grid gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((v, i) => (
          <Reveal key={v.id} delay={(i % 3) * 0.07}>
            <button onClick={() => setOpen(v)} className="group relative block w-full overflow-hidden rounded-2xl text-left">
              <img src={v.poster} alt={v.title} loading="lazy" className="aspect-video w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/35 transition group-hover:bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-[var(--gold)] group-hover:text-[#17130c]">
                  <Play size={22} fill="currentColor" />
                </span>
              </div>
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                <div className="text-sm font-semibold text-white">{v.title}</div>
                <div className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white/80">{v.duration}</div>
              </div>
            </button>
          </Reveal>
        ))}
      </section>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <button className="absolute right-5 top-5 rounded-full border border-white/30 p-2.5 text-white"><X size={18} /></button>
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
            {open.src ? (
              <video src={open.src} controls autoPlay preload="metadata" className="aspect-video w-full bg-black" />
            ) : (
              <div className="relative aspect-video w-full">
                <HeroCanvas />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center">
                  <div className="font-display text-2xl text-white">{open.title}</div>
                  <p className="mt-2 text-sm text-white/70">Full video premieres soon — a glimpse of the ambience above.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
