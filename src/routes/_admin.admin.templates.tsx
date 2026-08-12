import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/Templates'

export const Route = createFileRoute('/_admin/admin/templates')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — Templates' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
