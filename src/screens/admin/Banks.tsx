import { useRef, useState } from 'react'
import { useSearchParams } from '@/lib/router-compat'
import { Landmark, Pencil, Plus, QrCode, Star, Trash2, UploadCloud } from 'lucide-react'
import { ACard, Field } from './ui'
import { QrPlaceholder } from '@/screens/public/Booking'
import { uid, useCms } from '@/lib/store'
import type { BankAccount } from '@/lib/store'
import { uploadToBucket, deleteFromBucket, parseStorageUrl } from '@/lib/uploads'

const empty: Omit<BankAccount, 'id'> = { bankName: '', holder: '', number: '', ifsc: '', branch: '', upi: '', qr: '', instructions: '', enabled: true, isDefault: false }

export default function Banks() {
  const { banks, patch, log } = useCms()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState(sp.get('tab') ?? 'accounts')
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [uploading, setUploading] = useState(false)
  const qrRef = useRef<HTMLInputElement>(null)

  const save = () => {
    if (editId) {
      patch('banks', banks.map((b) => (b.id === editId ? { ...b, ...form } : b)))
      log(`Edited bank account ${form.bankName}`)
    } else {
      patch('banks', [...banks, { id: uid('b'), ...form }])
      log(`Added bank account ${form.bankName}`)
    }
    setEditId(null); setForm(empty)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Bank, UPI & QR Manager</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Unlimited bank accounts shown to customers during checkout. The default account appears in the booking flow.</p>
      </div>

      <div className="flex gap-2">
        {[['accounts', 'Bank Accounts'], ['upi', 'UPI IDs'], ['qr', 'QR Codes']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${tab === k ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]' : 'border-[var(--line)]'}`}>{l}</button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {banks.map((b) => (
            <ACard key={b.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><Landmark size={18} /></span>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">{b.bankName} {b.isDefault && <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold text-[#17130c]">DEFAULT</span>}</div>
                    <div className="text-xs text-[var(--ink-soft)]">{b.holder} · {b.number} · {b.ifsc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button title="Set default" onClick={() => { patch('banks', banks.map((x) => ({ ...x, isDefault: x.id === b.id }))); log(`${b.bankName} set as default bank`) }} className={`rounded-lg border p-2 ${b.isDefault ? 'border-[var(--gold)] text-gold' : 'border-[var(--line)]'}`}><Star size={13} /></button>
                  <button title={b.enabled ? 'Disable' : 'Enable'} onClick={() => patch('banks', banks.map((x) => (x.id === b.id ? { ...x, enabled: !x.enabled } : x)))}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${b.enabled ? 'border-green-400 text-green-600' : 'border-[var(--line)] text-[var(--ink-soft)]'}`}>{b.enabled ? 'ON' : 'OFF'}</button>
                  <button title="Edit" onClick={() => { setEditId(b.id); setForm({ ...b }) }} className="rounded-lg border border-[var(--line)] p-2 hover:border-[var(--gold)]"><Pencil size={13} /></button>
                  <button title="Delete" onClick={() => { patch('banks', banks.filter((x) => x.id !== b.id)); log(`Deleted bank ${b.bankName}`) }} className="rounded-lg border border-[var(--line)] p-2 hover:border-red-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
              {(tab === 'upi' || tab === 'accounts') && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3 text-xs">
                  <span className="text-[var(--ink-soft)]">UPI ID</span><span className="font-semibold">{b.upi}</span>
                </div>
              )}
              {(tab === 'qr' || tab === 'accounts') && (
                <div className="mt-3 flex items-center gap-4 rounded-xl bg-[var(--bg-soft)] p-4">
                  {b.qr ? <img src={b.qr} className="h-20 w-20 rounded-lg object-cover" alt="QR" /> : <QrPlaceholder value={b.upi} size={80} />}
                  <div className="text-xs text-[var(--ink-soft)]">Payment QR shown at checkout.<br />Upload a custom QR in the edit form →</div>
                </div>
              )}
            </ACard>
          ))}
        </div>

        {/* add / edit form */}
        <ACard title={editId ? 'Edit bank account' : 'Add bank account'} sub="All fields shown to customers at checkout">
          <div className="space-y-4">
            <Field label="Bank Name"><input className="input-lux" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} /></Field>
            <Field label="Account Holder"><input className="input-lux" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} /></Field>
            <Field label="Account Number"><input className="input-lux" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="IFSC"><input className="input-lux" value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value })} /></Field>
              <Field label="Branch"><input className="input-lux" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></Field>
            </div>
            <Field label="UPI ID"><input className="input-lux" value={form.upi} onChange={(e) => setForm({ ...form, upi: e.target.value })} /></Field>
            <Field label="QR Code Upload">
              <input ref={qrRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = ''
                if (!f) return
                setUploading(true)
                try {
                  const prev = parseStorageUrl(form.qr)
                  if (prev?.bucket === 'bank-qr') await deleteFromBucket('bank-qr', prev.path)
                  const res = await uploadToBucket('bank-qr', f, { folder: 'qr' })
                  setForm({ ...form, qr: res.url })
                } catch (err) { console.error(err); alert('Upload failed.') }
                finally { setUploading(false) }
              }} />
              <button onClick={() => !uploading && qrRef.current?.click()} disabled={uploading} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--line)] py-4 text-xs text-[var(--ink-soft)] hover:border-[var(--gold)]">
                {form.qr ? <img src={form.qr} className="h-16 w-16 rounded-lg object-cover" alt="" /> : <><UploadCloud size={16} className="text-gold" /> {uploading ? 'Uploading…' : 'Upload QR image'}</>}
              </button>
            </Field>
            <Field label="Payment Instructions"><textarea rows={3} className="input-lux" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></Field>
            <button onClick={save} disabled={!form.bankName || !form.number} className="btn-gold flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold disabled:opacity-40">
              <Plus size={15} /> {editId ? 'Save Changes' : 'Add Bank Account'}
            </button>
            {editId && <button onClick={() => { setEditId(null); setForm(empty) }} className="w-full text-center text-xs font-semibold text-[var(--ink-soft)]">Cancel editing</button>}
          </div>
          <QrCode size={0} className="hidden" />
        </ACard>
      </div>
    </div>
  )
}
