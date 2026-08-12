import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/Customers'

export const Route = createFileRoute('/_admin/admin/customers')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — Customers' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
