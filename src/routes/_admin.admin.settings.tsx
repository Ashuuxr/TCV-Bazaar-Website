import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/Settings'

export const Route = createFileRoute('/_admin/admin/settings')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — Settings' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
