import { Link } from '@/lib/router-compat'
import { Instagram, MessageCircle, Phone, Mail, MapPin } from 'lucide-react'
import Logo from './Logo'
import { useCms } from '@/lib/store'

export default function Footer() {
  const site = useCms((s) => s.site)
  const event = useCms((s) => s.event)
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--bg-soft)]">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div>
          <Logo className="h-12" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--ink-soft)]">{site.tagline}. {event.name} — {event.edition}, {event.datesLabel} at {event.venue}, {event.city}.</p>
          <div className="mt-5 flex gap-2.5">
            {[
              { href: site.social.instagram, icon: Instagram, label: 'Instagram' },
              { href: site.social.whatsapp, icon: MessageCircle, label: 'WhatsApp' },
              { href: `tel:${site.social.phone}`, icon: Phone, label: 'Phone' },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                className="glass-liquid glass-liquid-hover motion-press flex h-10 w-10 items-center justify-center rounded-full">
                <s.icon size={16} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ink-soft)]">
            {[['About', '/about'], ['Why Exhibit', '/why-exhibit'], ['Stall Packages', '/packages'], ['Stall Layout', '/stall-layout'], ['Gallery', '/gallery'], ['Videos', '/videos']].map(([l, to]) => (
              <li key={to}><Link className="transition hover:text-gold" to={to}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Support</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ink-soft)]">
            {[['Testimonials', '/testimonials'], ['FAQ', '/faq'], ['Contact', '/contact'], ['Customer Portal', '/portal'], ['Privacy Policy', '/privacy-policy'], ['Refund Policy', '/refund-policy'], ['Terms & Conditions', '/terms']].map(([l, to]) => (
              <li key={to}><Link className="transition hover:text-gold" to={to}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
            {site.contact.phones.map((p) => (
              <li key={p} className="flex items-center gap-2.5"><Phone size={14} className="text-gold" /> {p}</li>
            ))}
            <li className="flex items-center gap-2.5"><Mail size={14} className="text-gold" /> {site.contact.email}</li>
            <li className="flex items-start gap-2.5"><MapPin size={14} className="mt-0.5 text-gold" /> {site.contact.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-[var(--ink-soft)] sm:flex-row">
          <span>© 2026 {site.name}. All rights reserved.</span>
          <span>Crafted with ♥ in {event.city}</span>
        </div>
      </div>
    </footer>
  )
}
