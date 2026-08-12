import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Save } from 'lucide-react'
import { useCms } from '@/lib/store'
import type { CmsState } from '@/lib/store'

type DataKey = { [K in keyof CmsState]: CmsState[K] extends (...args: never[]) => unknown ? never : K }[keyof CmsState]

export function ACard({ title, sub, children, action }: { title?: string; sub?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card-bg)] p-6 shadow-sm">
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="font-display text-lg font-medium">{title}</h3>}
            {sub && <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label-lux">{label}</label>
      {children}
    </div>
  )
}

/** Local-draft editor: keeps a draft of a store value, saves via patch + activity log. */
export function useDraft<K extends DataKey>(key: K) {
  const value = useCms((s) => s[key])
  const patch = useCms((s) => s.patch)
  const log = useCms((s) => s.log)
  const [draft, setDraft] = useState<CmsState[K]>(value)
  const [dirty, setDirty] = useState(false)
  useEffect(() => { setDraft(value); setDirty(false) }, [value])
  const save = () => {
    patch(key, draft)
    log(`Updated ${String(key)}`)
    setDirty(false)
  }
  return { draft, setDraft: (v: CmsState[K]) => { setDraft(v); setDirty(true) }, save, dirty }
}

export function SaveBar({ dirty, onSave }: { dirty: boolean; onSave: () => void }) {
  if (!dirty) return null
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button onClick={onSave} className="btn-gold flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold shadow-2xl">
        <Save size={15} /> Save Changes
      </button>
    </div>
  )
}

export function Stat({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card-bg)] p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><Icon size={16} /></span>
      </div>
      <div className="font-display mt-3 text-3xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--ink-soft)]">{sub}</div>}
    </div>
  )
}
