import { RotateCcw } from 'lucide-react'
import { ACard, Field, SaveBar, useDraft } from './ui'
import Logo from '@/components/Logo'
import { useCms } from '@/lib/store'

const goldPresets = ['#b98a2f', '#c9a227', '#a67c00', '#d4af37', '#8c6a1f', '#c05621']
const bgPresets = ['#faf7f1', '#f7f3ea', '#fbf8f3', '#f5efe3', '#ffffff', '#f6f1e7']
const inkPresets = ['#17130c', '#1a1510', '#201812', '#12100c', '#231c12', '#0f0d0a']
const fonts = ['Fraunces', 'Playfair Display', 'Cormorant Garamond', 'Inter', 'Poppins', 'DM Serif Display']

export default function ThemeBuilder() {
  const { draft, setDraft, save, dirty } = useDraft('theme')
  const resetAll = useCms((s) => s.resetAll)
  const set = (p: Partial<typeof draft>) => setDraft({ ...draft, ...p } as never)

  const Swatches = ({ colors, value, onPick }: { colors: string[]; value: string; onPick: (c: string) => void }) => (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((c) => (
        <button key={c} onClick={() => onPick(c)} className={`h-9 w-9 rounded-full border-2 transition ${value === c ? 'scale-110 border-[var(--ink)]' : 'border-transparent'}`} style={{ background: c }} />
      ))}
      <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-[var(--line)] bg-transparent" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">Theme Builder</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Visual theme editor with live preview — colors, fonts, radius and mode.</p>
        </div>
        <button onClick={() => { if (confirm('Reset ALL website content to factory defaults?')) resetAll() }} className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-red-500">
          <RotateCcw size={13} /> Factory Reset
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ACard title="Colors">
            <div className="space-y-5">
              <Field label="Accent — Luxury Gold"><Swatches colors={goldPresets} value={draft.gold} onPick={(gold) => set({ gold })} /></Field>
              <Field label="Background — Warm White (light mode)"><Swatches colors={bgPresets} value={draft.bg} onPick={(bg) => set({ bg })} /></Field>
              <Field label="Primary Text (light mode)"><Swatches colors={inkPresets} value={draft.ink} onPick={(ink) => set({ ink })} /></Field>
            </div>
          </ACard>
          <ACard title="Typography & Shape">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Display Font (headings)">
                <select className="input-lux" value={draft.fontDisplay} onChange={(e) => set({ fontDisplay: e.target.value })}>
                  {fonts.map((f) => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Body Font">
                <select className="input-lux" value={draft.fontBody} onChange={(e) => set({ fontBody: e.target.value })}>
                  {['Inter', 'Poppins', 'DM Sans', 'Nunito', 'Fraunces'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label={`Corner Radius — ${draft.radius}px`}>
                <input type="range" min={0} max={28} value={draft.radius} onChange={(e) => set({ radius: Number(e.target.value) })} className="w-full accent-[#b98a2f]" />
              </Field>
              <Field label="Default Mode">
                <div className="flex gap-2">
                  {(['light', 'dark'] as const).map((m) => (
                    <button key={m} onClick={() => set({ mode: m })} className={`flex-1 rounded-xl border px-4 py-2.5 text-xs font-semibold capitalize ${draft.mode === m ? 'border-[var(--gold)] bg-[var(--gold)] text-[#17130c]' : 'border-[var(--line)]'}`}>{m}</button>
                  ))}
                </div>
              </Field>
            </div>
          </ACard>
        </div>

        {/* live preview */}
        <ACard title="Live preview" sub="Updates as you tweak — save to publish to the website.">
          <div className="overflow-hidden rounded-2xl border border-[var(--line)]" style={{ background: draft.mode === 'dark' ? '#0e0b07' : draft.bg, color: draft.mode === 'dark' ? '#f4ecdd' : draft.ink, fontFamily: draft.fontBody }}>
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: draft.mode === 'dark' ? '#2c2415' : '#e7ddcc' }}>
              <Logo className="h-8" gold={draft.mode === 'dark'} />
              <div className="flex gap-3 text-[10px] opacity-70"><span>Home</span><span>Packages</span><span>Layout</span></div>
            </div>
            <div className="p-6 text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: draft.gold }}>Diwali Edition · 2026</div>
              <div className="mt-2 text-2xl font-medium leading-tight" style={{ fontFamily: draft.fontDisplay }}>Where Gwalior<br />Celebrates Together</div>
              <div className="mt-4 flex justify-center gap-2">
                <span className="rounded-full px-4 py-2 text-[10px] font-semibold" style={{ background: draft.mode === 'dark' ? '#f4ecdd' : draft.ink, color: draft.mode === 'dark' ? '#17130c' : draft.bg }}>Book Your Stall</span>
                <span className="rounded-full border px-4 py-2 text-[10px] font-semibold" style={{ borderColor: draft.gold, color: draft.gold }}>View Layout</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {['Premium ₹40,000', 'Standard ₹30,000', 'Branding ₹5,000'].map((x) => (
                  <div key={x} className="p-3 text-[9px] font-medium" style={{ background: draft.mode === 'dark' ? '#171208' : '#ffffff', borderRadius: draft.radius, border: `1px solid ${draft.mode === 'dark' ? '#2c2415' : '#e7ddcc'}` }}>{x}</div>
                ))}
              </div>
            </div>
          </div>
        </ACard>
      </div>
      <SaveBar dirty={dirty} onSave={save} />
    </div>
  )
}
