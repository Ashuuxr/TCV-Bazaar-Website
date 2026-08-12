import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/Payments'

export const Route = createFileRoute('/_admin/admin/payments')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — Payments' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
