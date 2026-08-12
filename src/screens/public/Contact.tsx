import { useState } from 'react'
import { Instagram, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/Reveal'
import { useCms } from '@/lib/store'
import { track } from '@/lib/useTracker'

export default function Contact() {
  const site = useCms((s) => s.site)
  const log = useCms((s) => s.log)
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    log(`Contact enquiry from ${form.name} (${form.phone})`)
    track('Contact', { source: 'contact_form' })
    setSent(true)
  }

  return (
    <div>
      <PageHero eyebrow="Contact" title="Let's plan your stall together" sub="Call, message or write — our team replies within hours." />
      <section className="container-x grid gap-10 pb-24 lg:grid-cols-5">
        <Reveal className="lg:col-span-2">
          <div className="space-y-4">
            {site.contact.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="card-lux flex items-center gap-4 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><Phone size={18} /></span>
                <div><div className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">Call us</div><div className="font-semibold">{p}</div></div>
              </a>
            ))}
            <a href={`mailto:${site.contact.email}`} className="card-lux flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><Mail size={18} /></span>
              <div><div className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">Email</div><div className="break-all font-semibold">{site.contact.email}</div></div>
            </a>
            <div className="card-lux flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold"><MapPin size={18} /></span>
              <div><div className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">Visit</div><div className="font-semibold">{site.contact.address}</div></div>
            </div>
            <div className="flex gap-3 pt-2">
              <a href={site.social.instagram} target="_blank" rel="noreferrer" className="btn-outline-gold flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"><Instagram size={16} /> Instagram</a>
              <a href={site.social.whatsapp} target="_blank" rel="noreferrer" className="btn-outline-gold flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"><MessageCircle size={16} /> WhatsApp</a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="lg:col-span-3">
          <form onSubmit={submit} className="card-lux p-8">
            <h2 className="font-display text-2xl font-medium">Send us a message</h2>
            {sent ? (
              <div className="mt-6 rounded-2xl border border-[var(--gold)] bg-[var(--bg-soft)] p-6 text-center">
                <div className="font-display text-xl text-gold">Thank you, {form.name.split(' ')[0]}!</div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">Your message is with our team. Expect a call or WhatsApp reply shortly.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div><label className="label-lux">Your Name</label><input required className="input-lux" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
                <div><label className="label-lux">Phone</label><input required className="input-lux" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91" /></div>
                <div className="sm:col-span-2"><label className="label-lux">Email</label><input type="email" className="input-lux" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" /></div>
                <div className="sm:col-span-2"><label className="label-lux">Message</label><textarea rows={4} required className="input-lux" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your brand and what you're looking for…" /></div>
                <button className="btn-gold flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold sm:col-span-2">
                  <Send size={15} /> Send Message
                </button>
              </div>
            )}
          </form>
        </Reveal>
      </section>
    </div>
  )
}
