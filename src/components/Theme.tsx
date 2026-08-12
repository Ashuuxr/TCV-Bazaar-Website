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
    if (theme.mode === 'dark') {
      r.classList.add('dark')
      r.style.setProperty('--bg', '#0e0b07')
      r.style.setProperty('--ink', '#f4ecdd')
    } else {
      r.classList.remove('dark')
      r.style.setProperty('--bg', theme.bg)
      r.style.setProperty('--ink', theme.ink)
    }
    localStorage.setItem('tcv-theme-mode', theme.mode)
  }, [theme])
}
