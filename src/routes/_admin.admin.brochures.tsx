import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/BrochureManager'

export const Route = createFileRoute('/_admin/admin/brochures')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — Brochure Manager' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})