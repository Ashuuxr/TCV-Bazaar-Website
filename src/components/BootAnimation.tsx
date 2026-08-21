import { useEffect, useState } from 'react'
import Logo from '@/components/Logo'

const BOOT_KEY = 'tcv-boot-animation-seen'

export default function BootAnimation() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = window.sessionStorage.getItem(BOOT_KEY)
    if (seen) return

    setVisible(true)
    window.sessionStorage.setItem(BOOT_KEY, '1')
    const timer = window.setTimeout(() => setVisible(false), 1450)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="tcv-boot" role="status" aria-label="Loading TCV Bazaar">
      <div className="tcv-boot__halo" aria-hidden="true" />
      <div className="tcv-boot__brand">
        <Logo gold className="tcv-boot__logo" />
        <span className="tcv-boot__line" aria-hidden="true" />
      </div>
    </div>
  )
}
