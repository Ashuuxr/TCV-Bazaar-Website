import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/ThemeBuilder'

export const Route = createFileRoute('/_admin/admin/theme')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — ThemeBuilder' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
