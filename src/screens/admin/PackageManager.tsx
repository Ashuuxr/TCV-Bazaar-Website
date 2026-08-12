import { Plus, Star, Trash2 } from 'lucide-react'
import { ACard, Field } from './ui'
import { uid, useCms } from '@/lib/store'
import type { Pkg } from '@/lib/store'

export default function PackageManager() {
  const { packages, patch, log } = useCms()
  const upd = (id: string, p: Partial<Pkg>) => { patch('packages', packages.map((x) => (x.id === id ? { ...x, ...p } : x))); }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">Package Manager</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Prices, features and visibility of every stall package.</p>
        </div>
        <button onClick={() => { patch('packages', [...packages, { id: uid('p'), name: 'New Package', price: 10000, size: '', tag: '', features: ['Feature 1'], popular: false, enabled: true }]); log('Added package') }}
          className="btn-gold flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"><Plus size={14} /> Add Package</button>
      </div>

      <div className="space-y-5">
        {packages.map((p) => (
          <ACard key={p.id}>
            <div className="grid gap-4 lg:grid-cols-4">
              <Field label="Package Name"><input className="input-lux" value={p.name} onChange={(e) => upd(p.id, { name: e.target.value })} /></Field>
              <Field label="Price (₹)"><input type="number" className="input-lux" value={p.price} onChange={(e) => upd(p.id, { price: Number(e.target.value) })} /></Field>
              <Field label="Size"><input className="input-lux" value={p.size} onChange={(e) => upd(p.id, { size: e.target.value })} /></Field>
              <Field label="Tag"><input className="input-lux" value={p.tag} onChange={(e) => upd(p.id, { tag: e.target.value })} /></Field>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Field label="Features (one per line)">
                <textarea rows={5} className="input-lux" value={p.features.join('\n')} onChange={(e) => upd(p.id, { features: e.target.value.split('\n').filter(Boolean) })} />
              </Field>
              <div className="flex flex-col justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => upd(p.id, { popular: !p.popular })} className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold ${p.popular ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]' : 'border-[var(--line)]'}`}><Star size={13} /> Most Popular</button>
                  <button onClick={() => upd(p.id, { enabled: !p.enabled })} className={`rounded-full border px-4 py-2.5 text-xs font-semibold ${p.enabled ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-[var(--line)] text-[var(--ink-soft)]'}`}>{p.enabled ? 'Visible on site' : 'Hidden'}</button>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => log(`Updated package ${p.name}`)} className="btn-outline-gold rounded-full px-5 py-2.5 text-xs font-semibold">Done</button>
                  <button onClick={() => { if (confirm(`Delete ${p.name}? Linked stalls keep their pricing snapshot.`)) { patch('packages', packages.filter((x) => x.id !== p.id)); log(`Deleted package ${p.name}`) } }}
                    className="flex items-center gap-2 rounded-full border border-red-300 px-5 py-2.5 text-xs font-semibold text-red-500"><Trash2 size={13} /> Delete</button>
                </div>
              </div>
            </div>
          </ACard>
        ))}
      </div>
    </div>
  )
}
