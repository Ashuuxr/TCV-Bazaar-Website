import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/PackageManager'

export const Route = createFileRoute('/_admin/admin/packages')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — PackageManager' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
