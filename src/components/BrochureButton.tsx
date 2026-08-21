import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { getActivePublicBrochure, type PublicBrochure } from '@/lib/brochures.functions'
import { supabase } from '@/integrations/supabase/client'

/** Public-site brochure download button.
 *  - Fetches the currently-active brochure via a server function.
 *  - Renders nothing when the section is disabled or no brochure exists.
 *  - Re-fetches when the admin toggles the section (site_content changes) or
 *    when brochures rows change (Realtime). */
export default function BrochureButton({ className }: { className?: string }) {
  const [brochure, setBrochure] = useState<PublicBrochure | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      getActivePublicBrochure().then((b) => { if (!cancelled) setBrochure(b) }).catch(() => { if (!cancelled) setBrochure(null) })
    }
    load()
    const ch1 = supabase
      .channel('public:brochures-btn')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brochures' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content', filter: 'id=eq.main' }, load)
      .subscribe()
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      supabase.removeChannel(ch1)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  if (!brochure) return null
  return (
    <a
      href={brochure.signed_url}
      target="_blank"
      rel="noopener noreferrer"
      download={brochure.file_name}
      className={className ?? 'btn-outline-gold motion-press flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white'}
      title={brochure.description || brochure.title}
    >
      <Download size={15} /> {brochure.title || 'Brochure'}
    </a>
  )
}