import { useState } from 'react'
import { useSearchParams } from '@/lib/router-compat'
import { ACard, SaveBar, useDraft } from './ui'

export default function Templates() {
  const { draft, setDraft, save, dirty } = useDraft('templates')
  const [sp] = useSearchParams()
  const [tab, setTab] = useState(sp.get('tab') ?? 'email')
  const vars = ['{name}', '{event}', '{package}', '{stall}', '{booking_id}', '{paid}', '{balance}']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Email & WhatsApp Templates</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Confirmation messages sent automatically after every booking.</p>
      </div>
      <div className="flex gap-2">
        {[['email', 'Email Templates'], ['whatsapp', 'WhatsApp Templates']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${tab === k ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]' : 'border-[var(--line)]'}`}>{l}</button>
        ))}
      </div>
      <ACard
        title={tab === 'email' ? 'Booking Confirmation Email' : 'Booking Confirmation WhatsApp'}
        sub="Variables are replaced automatically when the message is sent."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {vars.map((v) => <span key={v} className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[11px] font-semibold text-gold">{v}</span>)}
        </div>
        <textarea
          rows={10}
          className="input-lux font-mono text-xs"
          value={tab === 'email' ? draft.emailConfirmation : draft.whatsappConfirmation}
          onChange={(e) => setDraft(tab === 'email' ? { ...draft, emailConfirmation: e.target.value } as never : { ...draft, whatsappConfirmation: e.target.value } as never)}
        />
        <div className="mt-5 rounded-2xl bg-[var(--bg-soft)] p-5">
          <div className="label-lux">Preview</div>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--ink-soft)]">
            {(tab === 'email' ? draft.emailConfirmation : draft.whatsappConfirmation)
              .replace('{name}', 'Priya Sharma').replaceAll('{event}', 'TCV Bazaar 2026 — Diwali Edition')
              .replace('{package}', 'Premium Tent').replace('{stall}', 'A3')
              .replace('{booking_id}', 'TCV26-DEMO42').replace('{paid}', '40,000').replace('{balance}', '0')}
          </pre>
        </div>
      </ACard>
      <SaveBar dirty={dirty} onSave={save} />
    </div>
  )
}
