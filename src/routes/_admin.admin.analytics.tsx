import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/Analytics'

export const Route = createFileRoute('/_admin/admin/analytics')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — Analytics' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
