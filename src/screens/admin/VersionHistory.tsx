import { useEffect, useMemo, useState } from 'react'
import { History, RotateCcw, Trash2, Eye, X } from 'lucide-react'
import { ACard, Field } from './ui'
import { listVersions, getVersion, restoreVersion, deleteVersions, type VersionRow } from '@/lib/versionHistory.functions'

const MODULES = [
  'theme', 'site', 'brand', 'hero', 'event', 'packages', 'stalls', 'gallery',
  'videos', 'testimonials', 'faqs', 'banks', 'pages', 'templates', 'media',
] as const

function fmt(dt: string) {
  return new Date(dt).toLocaleString()
}

export default function VersionHistory() {
  const [rows, setRows] = useState<VersionRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [module, setModule] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [author, setAuthor] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50
  const [preview, setPreview] = useState<{ id: string; data: Record<string, unknown> } | null>(null)
  const [previewModule, setPreviewModule] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string>('')

  const authors = useMemo(() => {
    const map = new Map<string, string>()
    rows.forEach((r) => { if (r.author_id) map.set(r.author_id, r.author_email || r.author_id) })
    return Array.from(map.entries())
  }, [rows])

  const load = async () => {
    setLoading(true)
    try {
      const res = await listVersions({ data: {
        module: module || undefined,
        authorId: author || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        limit, offset,
      } as never })
      setRows(res.rows as VersionRow[])
      setCount(res.count)
    } catch (e) { setMsg((e as Error).message) } finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [module, from, to, author, offset])

  const openPreview = async (id: string) => {
    const v = await getVersion({ data: { id } as never })
    if (v) {
      const data = ((v as { data: Record<string, unknown> }).data) ?? {}
      setPreview({ id, data })
      setPreviewModule(Object.keys(data)[0] ?? '')
    }
  }

  const doRestore = async (id: string) => {
    const reason = window.prompt('Restore reason (optional):') ?? undefined
    if (!window.confirm('Restore this version? A new version will be created; nothing is lost.')) return
    setBusy(true)
    try {
      await restoreVersion({ data: { id, reason } as never })
      setMsg('Version restored — public site will update within a few seconds.')
      setPreview(null)
      await load()
    } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) }
  }

  const doDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this version? This cannot be undone.')) return
    setBusy(true)
    try {
      await deleteVersions({ data: { ids: [id] } as never })
      await load()
    } catch (e) { setMsg((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display flex items-center gap-2 text-2xl font-medium sm:text-3xl"><History size={22} /> Version History</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Every save is snapshotted. Preview any previous version, then restore in one click. Restores create a new version — nothing is overwritten.</p>
      </div>

      <ACard title="Filters">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Module">
            <select className="input-lux" value={module} onChange={(e) => { setOffset(0); setModule(e.target.value) }}>
              <option value="">All modules</option>
              {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Author">
            <select className="input-lux" value={author} onChange={(e) => { setOffset(0); setAuthor(e.target.value) }}>
              <option value="">Any admin</option>
              {authors.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </Field>
          <Field label="From"><input type="date" className="input-lux" value={from} onChange={(e) => { setOffset(0); setFrom(e.target.value) }} /></Field>
          <Field label="To"><input type="date" className="input-lux" value={to} onChange={(e) => { setOffset(0); setTo(e.target.value) }} /></Field>
        </div>
      </ACard>

      {msg && <div className="rounded-xl border border-[var(--gold)] bg-[var(--bg-soft)] px-4 py-3 text-xs">{msg}</div>}

      <ACard title={`Versions (${count})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-[var(--ink-soft)]">
              <tr><th className="py-2">Date</th><th>Author</th><th>Source</th><th>Changed modules</th><th>Reason</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td className="py-4" colSpan={6}>Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td className="py-4 text-[var(--ink-soft)]" colSpan={6}>No versions match.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[var(--line)]">
                  <td className="py-2 pr-3 whitespace-nowrap">{fmt(r.created_at)}</td>
                  <td className="py-2 pr-3">{r.author_email ?? <span className="text-[var(--ink-soft)]">system</span>}</td>
                  <td className="py-2 pr-3"><span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-xs">{r.source}</span></td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {(r.changed_modules ?? []).map((m) => <span key={m} className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs">{m}</span>)}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-xs text-[var(--ink-soft)]">{r.reason || '—'}</td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openPreview(r.id)} className="rounded-lg border border-[var(--line)] p-2 hover:border-[var(--gold)]" title="Preview"><Eye size={13} /></button>
                      <button disabled={busy} onClick={() => doRestore(r.id)} className="rounded-lg border border-[var(--line)] p-2 hover:border-[var(--gold)]" title="Restore"><RotateCcw size={13} /></button>
                      <button disabled={busy} onClick={() => doDelete(r.id)} className="rounded-lg border border-[var(--line)] p-2 hover:border-red-400 hover:text-red-500" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--ink-soft)]">
          <span>Showing {rows.length ? offset + 1 : 0}–{offset + rows.length} of {count}</span>
          <div className="flex gap-2">
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="rounded-full border border-[var(--line)] px-3 py-1 disabled:opacity-40">Prev</button>
            <button disabled={offset + limit >= count} onClick={() => setOffset(offset + limit)} className="rounded-full border border-[var(--line)] px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      </ACard>

      {preview && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setPreview(null)}>
          <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-[var(--card-bg)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-medium">Version preview</h3>
              <button onClick={() => setPreview(null)}><X size={18} /></button>
            </div>
            <div className="mb-4">
              <Field label="Module">
                <select className="input-lux" value={previewModule} onChange={(e) => setPreviewModule(e.target.value)}>
                  {Object.keys(preview.data).map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
            </div>
            <pre className="max-h-[60vh] overflow-auto rounded-xl bg-[var(--bg-soft)] p-4 text-xs">{JSON.stringify(preview.data[previewModule], null, 2)}</pre>
            <div className="mt-4 flex justify-end gap-2">
              <button disabled={busy} onClick={() => doRestore(preview.id)} className="btn-gold flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"><RotateCcw size={13} /> Restore this version</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}