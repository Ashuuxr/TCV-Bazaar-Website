import { useRef, useState } from 'react'
import { Loader2, Trash2, UploadCloud, X } from 'lucide-react'
import HeroCanvas from '@/components/HeroCanvas'
import { ACard, Field, SaveBar, useDraft } from './ui'
import { useCms } from '@/lib/store'
import { supabase } from '@/integrations/supabase/client'
import { uploadToBucket, parseStorageUrl } from '@/lib/uploads'

const HERO_BUCKET = 'hero-videos'
const ACCEPTED_TYPES = ['video/mp4', 'video/webm']
const MAX_BYTES = 200 * 1024 * 1024 // 200 MB

function heroVideoPathFromUrl(url: string): string | null {
  const parsed = parseStorageUrl(url)
  if (!parsed || parsed.bucket !== HERO_BUCKET) return null
  return parsed.path
}

export default function HeroManager() {
  const { draft, setDraft, save, dirty } = useDraft('hero')
  const media = useCms((s) => s.media)
  const fileRef = useRef<HTMLInputElement>(null)
  const videos = media.filter((m) => m.kind.startsWith('video'))
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setUploadError(null)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Only MP4 or WebM videos are supported.')
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError(`File is too large (${Math.round(file.size / 1024 / 1024)} MB). Max is 200 MB.`)
      return
    }
    setUploading(true)
    try {
      const previousPath = heroVideoPathFromUrl(draft.videoDataUrl)
      const ext = file.type === 'video/webm' ? 'webm' : 'mp4'
      const result = await uploadToBucket(HERO_BUCKET, file, { filename: `hero-${Date.now()}.${ext}` })
      setDraft({ ...draft, videoDataUrl: result.url } as never)
      if (previousPath && previousPath !== result.path) {
        // Best-effort cleanup of the replaced object.
        void supabase.storage.from(HERO_BUCKET).remove([previousPath])
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setUploadError(msg)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const deleteVideo = async () => {
    const previousPath = heroVideoPathFromUrl(draft.videoDataUrl)
    setDraft({ ...draft, videoDataUrl: '' } as never)
    if (previousPath) {
      void supabase.storage.from(HERO_BUCKET).remove([previousPath])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Hero Manager</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Control the full-screen hero: headline, drone video, overlay and countdown.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ACard title="Hero content">
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Heading (line 1)"><input className="input-lux" value={draft.heading} onChange={(e) => setDraft({ ...draft, heading: e.target.value } as never)} /></Field>
              <Field label="Heading (gold highlight)"><input className="input-lux" value={draft.highlight} onChange={(e) => setDraft({ ...draft, highlight: e.target.value } as never)} /></Field>
            </div>
            <Field label="Subheading"><textarea rows={3} className="input-lux" value={draft.subheading} onChange={(e) => setDraft({ ...draft, subheading: e.target.value } as never)} /></Field>
            <Field label={`Dark overlay — ${Math.round(draft.overlay * 100)}%`}>
              <input type="range" min={0} max={90} value={draft.overlay * 100} onChange={(e) => setDraft({ ...draft, overlay: Number(e.target.value) / 100 } as never)} className="w-full accent-[#b98a2f]" />
            </Field>
            <Field label="Countdown timer">
              <button onClick={() => setDraft({ ...draft, showCountdown: !draft.showCountdown } as never)}
                className={`rounded-full border px-5 py-2.5 text-xs font-semibold ${draft.showCountdown ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]' : 'border-[var(--line)]'}`}>
                {draft.showCountdown ? 'Visible' : 'Hidden'}
              </button>
            </Field>
            <Field label="Video playback">
              <div className="flex flex-wrap gap-2">
                {([
                  ['autoplay', 'Autoplay'],
                  ['muted', 'Muted'],
                  ['loop', 'Loop'],
                  ['playOnMobile', 'Play on mobile'],
                  ['enabled', 'Enable video'],
                  ['visible', 'Show video'],
                ] as const).map(([key, label]) => {
                  const on = (draft as never as Record<string, boolean>)[key] !== false
                  return (
                    <button
                      key={key}
                      onClick={() => setDraft({ ...draft, [key]: !on } as never)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold ${on ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]' : 'border-[var(--line)]'}`}
                    >
                      {label}: {on ? 'On' : 'Off'}
                    </button>
                  )
                })}
              </div>
            </Field>
          </div>
        </ACard>

        <ACard title="Hero video" sub="Upload an MP4 or WebM drone video (up to 200 MB). Stored in Cloud Storage and streamed to the public site. Without a video, the poster image is shown.">
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void uploadFile(f)
            }}
          />
          <div className="space-y-4">
            <button
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--line)] p-8 text-sm text-[var(--ink-soft)] transition hover:border-[var(--gold)] disabled:opacity-60"
            >
              {uploading ? <Loader2 size={24} className="animate-spin text-gold" /> : <UploadCloud size={24} className="text-gold" />}
              {uploading ? 'Uploading video…' : draft.videoDataUrl ? 'Replace hero video' : 'Upload hero video'}
            </button>
            {uploadError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-500">{uploadError}</div>
            )}
            {videos.length > 0 && (
              <Field label="…or pick from Media Library">
                <select className="input-lux" value="" onChange={(e) => e.target.value && setDraft({ ...draft, videoDataUrl: e.target.value } as never)}>
                  <option value="">Select a video</option>
                  {videos.map((v) => <option key={v.id} value={v.dataUrl}>{v.name}</option>)}
                </select>
              </Field>
            )}
            {draft.videoDataUrl && (
              <div className="flex items-center justify-between rounded-xl border border-[var(--gold)] bg-[var(--bg-soft)] px-4 py-3 text-xs">
                <span className="truncate font-semibold text-gold">Active: {draft.videoDataUrl.split('/').pop()}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDraft({ ...draft, videoDataUrl: '' } as never)} className="flex items-center gap-1 text-[var(--ink-soft)] hover:text-gold" title="Clear reference (keep file in storage)"><X size={13} /> Clear</button>
                  <button onClick={() => void deleteVideo()} className="flex items-center gap-1 text-red-500" title="Delete from Cloud Storage"><Trash2 size={13} /> Delete</button>
                </div>
              </div>
            )}
          </div>
        </ACard>
      </div>

      {/* preview */}
      <ACard title="Live preview">
        <div className="relative h-72 overflow-hidden rounded-2xl">
          {draft.videoDataUrl && draft.enabled !== false && draft.visible !== false ? (
            <video key={draft.videoDataUrl} src={draft.videoDataUrl} autoPlay loop muted playsInline poster={draft.poster || undefined} className="absolute inset-0 h-full w-full object-cover" />
          ) : draft.poster ? (
            <img src={draft.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <HeroCanvas />
          )}
          <div className="absolute inset-0" style={{ background: `rgba(8,6,10,${draft.overlay})` }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="font-display text-2xl text-white sm:text-4xl">{draft.heading} <span className="gold-shimmer">{draft.highlight}</span></div>
            <p className="mt-2 max-w-md text-xs text-white/70">{draft.subheading}</p>
          </div>
        </div>
      </ACard>
      <SaveBar dirty={dirty} onSave={save} />
    </div>
  )
}
