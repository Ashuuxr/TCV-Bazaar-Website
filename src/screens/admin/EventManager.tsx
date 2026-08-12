import { ACard, Field, SaveBar, useDraft } from './ui'

export default function EventManager() {
  const { draft, setDraft, save, dirty } = useDraft('event')
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Event Manager</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Dates, venue and edition — the countdown updates automatically.</p>
      </div>
      <ACard title="Event details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Event Name"><input className="input-lux" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value } as never)} /></Field>
          <Field label="Edition"><input className="input-lux" value={draft.edition} onChange={(e) => setDraft({ ...draft, edition: e.target.value } as never)} /></Field>
          <Field label="Venue"><input className="input-lux" value={draft.venue} onChange={(e) => setDraft({ ...draft, venue: e.target.value } as never)} /></Field>
          <Field label="City"><input className="input-lux" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value } as never)} /></Field>
          <Field label="Dates Label (shown on site)"><input className="input-lux" value={draft.datesLabel} onChange={(e) => setDraft({ ...draft, datesLabel: e.target.value } as never)} /></Field>
          <Field label="Countdown Target (start)"><input type="datetime-local" className="input-lux" value={draft.startISO.slice(0, 16)} onChange={(e) => setDraft({ ...draft, startISO: new Date(e.target.value).toISOString() } as never)} /></Field>
        </div>
      </ACard>
      <SaveBar dirty={dirty} onSave={save} />
    </div>
  )
}
