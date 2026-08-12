import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/Banks'

export const Route = createFileRoute('/_admin/admin/banks')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — Banks' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
