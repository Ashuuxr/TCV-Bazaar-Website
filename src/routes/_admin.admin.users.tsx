import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/UserManager'

export const Route = createFileRoute('/_admin/admin/users')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — User Management' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})