import { useEffect } from 'react'
import { useCms } from '@/lib/store'

/** Applies CMS theme tokens (colors, radius, fonts) + light/dark mode to the document. */
export function useApplyTheme() {
  const theme = useCms((s) => s.theme)
  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--gold', theme.gold)
    r.style.setProperty('--radius-brand', `${theme.radius}px`)
    r.style.setProperty('--font-display', theme.fontDisplay)
    r.style.setProperty('--font-body', theme.fontBody)
    // TCV Bazaar is intentionally dark-only for the premium public experience.
    r.classList.add('dark')
r.style.setProperty('--bg', '#0b1414')
r.style.setProperty('--bg-soft', '#101c1b')
r.style.setProperty('--ink', '#f5f2e9')
    r.style.setProperty('--card-bg', 'rgba(255,255,255,.055)')
    r.style.setProperty('--line', 'rgba(255,255,255,.14)')
    r.style.setProperty('--ink-soft', '#afa79a')
    localStorage.setItem('tcv-theme-mode', 'dark')
  }, [theme])
}
