import { useRef, useState } from 'react'
import { Pencil, Plus, Trash2, UploadCloud } from 'lucide-react'
import { ACard, Field } from './ui'
import { uid, useCms } from '@/lib/store'
import { uploadToBucket, deleteFromBucket, parseStorageUrl } from '@/lib/uploads'

export default function GalleryManager() {
  const { gallery, media, patch, log } = useCms()
  const fileRef = useRef<HTMLInputElement>(null)
  const [edit, setEdit] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const images = media.filter((m) => m.kind.startsWith('image'))

  const addItem = (src: string, name: string) => {
    patch('gallery', [...gallery, { id: uid('g'), src, title: name.replace(/\.[^.]+$/, ''), category: 'Uploads' }])
    log('Added gallery image')
  }
  const deleteItem = async (id: string) => {
    const item = gallery.find((x) => x.id === id)
    const ref = parseStorageUrl(item?.src)
    patch('gallery', gallery.filter((x) => x.id !== id))
    log('Deleted gallery image')
    if (ref?.bucket === 'gallery') await deleteFromBucket('gallery', ref.path)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">Gallery Manager</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Add, caption, categorise or remove gallery images. Changes appear instantly on the Gallery page.</p>
        </div>
        <button onClick={() => fileRef.current?.click()} className="btn-gold flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"><UploadCloud size={14} /> Upload Image</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
        const files = Array.from(e.target.files ?? [])
        e.target.value = ''
        setBusy(true)
        try {
          for (const f of files) {
            const res = await uploadToBucket('gallery', f, { folder: 'items' })
            addItem(res.url, res.name)
          }
        } catch (err) { console.error(err); alert('Upload failed.') }
        finally { setBusy(false) }
      }} />

      {images.length > 0 && (
        <ACard title="Add from Media Library">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((m) => (
              <button key={m.id} onClick={() => addItem(m.dataUrl, m.name)} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--line)]">
                <img src={m.dataUrl} className="h-full w-full object-cover" alt="" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"><Plus size={18} className="text-white" /></span>
              </button>
            ))}
          </div>
        </ACard>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {gallery.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card-bg)]">
            <img src={g.src} alt={g.title} className="aspect-[4/3] w-full object-cover" />
            {edit === g.id ? (
              <div className="space-y-2 p-3">
                <Field label="Title"><input autoFocus className="input-lux px-3 py-2 text-xs" value={g.title} onChange={(e) => patch('gallery', gallery.map((x) => (x.id === g.id ? { ...x, title: e.target.value } : x)))} /></Field>
                <Field label="Category"><input className="input-lux px-3 py-2 text-xs" value={g.category} onChange={(e) => patch('gallery', gallery.map((x) => (x.id === g.id ? { ...x, category: e.target.value } : x)))} /></Field>
                <button onClick={() => { setEdit(null); log('Updated gallery item') }} className="btn-gold w-full rounded-full py-2 text-xs font-semibold">Done</button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3">
                <div className="min-w-0"><div className="truncate text-xs font-semibold">{g.title}</div><div className="text-[10px] text-[var(--ink-soft)]">{g.category}</div></div>
                <div className="flex gap-1.5">
                  <button onClick={() => setEdit(g.id)} className="rounded-lg border border-[var(--line)] p-1.5 hover:border-[var(--gold)]"><Pencil size={11} /></button>
                  <button onClick={() => deleteItem(g.id)} className="rounded-lg border border-[var(--line)] p-1.5 hover:border-red-400 hover:text-red-500"><Trash2 size={11} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
