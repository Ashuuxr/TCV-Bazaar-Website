import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from '@/lib/router-compat'
import { Menu, Moon, Sun, X } from 'lucide-react'
import Logo from './Logo'
import { useCms } from '@/lib/store'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/why-exhibit', label: 'Why Exhibit' },
  { to: '/packages', label: 'Packages' },
  { to: '/stall-layout', label: 'Stall Layout' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/videos', label: 'Videos' },
  { to: '/testimonials', label: 'Testimonials' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const mode = useCms((s) => s.theme.mode)
  const theme = useCms((s) => s.theme)
  const patch = useCms((s) => s.patch)
  const loc = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => { setOpen(false) }, [loc.pathname])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? 'border-b border-[color-mix(in_srgb,var(--line)_75%,transparent)] bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-2xl shadow-[0_12px_40px_-28px_rgba(23,19,12,.55)]'
          : 'bg-transparent'
      }`}
    >
      <div className="container-x flex h-[78px] items-center justify-between gap-5">
        <Link to="/" className="motion-press flex items-center gap-3" aria-label="TCV Bazaar home">
          <Logo className="" useBrandSize gold={!scrolled && loc.pathname === '/'} />
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `motion-press rounded-full px-3 py-2 text-[12px] font-semibold tracking-[0.01em] transition-colors ${
                  isActive ? 'text-gold' : 'hover:text-gold'
                } ${!scrolled && loc.pathname === '/' && mode === 'light' ? 'text-white/85' : ''}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => patch('theme', { ...theme, mode: mode === 'dark' ? 'light' : 'dark' })}
            aria-label="Toggle theme"
            className={`motion-press flex h-10 w-10 items-center justify-center rounded-full border transition ${
              !scrolled && loc.pathname === '/' && mode === 'light'
                ? 'border-white/25 text-white hover:bg-white/10'
                : 'border-[var(--line)] hover:border-[var(--gold)]'
            }`}
          >
            {mode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link to="/book" className="btn-gold hidden rounded-full px-5 py-2.5 text-[12px] font-semibold tracking-wide sm:inline-flex">
            Book Your Stall
          </Link>
          <button
            className={`motion-press flex h-10 w-10 items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] xl:hidden ${
              !scrolled && loc.pathname === '/' && mode === 'light' ? 'border-white/25 text-white' : 'border-[var(--line)]'
            }`}
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--line)] bg-[var(--bg)] xl:hidden">
          <nav className="container-x grid grid-cols-2 gap-1 py-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `motion-press rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-[var(--bg-soft)] text-gold' : ''}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/book" className="btn-gold col-span-2 mt-2 rounded-xl px-4 py-3 text-center text-sm font-semibold">
              Book Your Stall
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}
