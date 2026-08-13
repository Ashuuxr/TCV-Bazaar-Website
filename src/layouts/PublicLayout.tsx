import { useEffect } from 'react'
import { Outlet, useLocation } from '@/lib/router-compat'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import TrackingLoader from '@/components/TrackingLoader'
import { useHydrated } from '@/lib/use-hydrated'
import { useApplyTheme } from '@/components/Theme'
import { useSyncStallsFromCloud, useSyncSiteContent, useSyncPublicStorageMedia } from '@/lib/useCloudSync'
import { useApplyBrand } from '@/lib/useApplyBrand'

export default function PublicLayout() {
  useApplyTheme()
  useApplyBrand()
  useSyncStallsFromCloud()
  useSyncSiteContent()
  useSyncPublicStorageMedia()
  const { pathname } = useLocation()
  // Refetch cloud CMS content on every SPA navigation so the newest content
  // shows even if Realtime dropped or the tab was never blurred.
  useEffect(() => {
    const w = window as unknown as { __tcvRefetchSiteContent?: () => void }
    w.__tcvRefetchSiteContent?.()
  }, [pathname])
  const hydrated = useHydrated()
  if (!hydrated) {
    return <div className="min-h-screen" style={{ background: '#faf7f1' }} />
  }
  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <TrackingLoader scope="public" />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
