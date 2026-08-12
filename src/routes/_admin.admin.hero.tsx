import { createFileRoute } from '@tanstack/react-router'
import Page from '@/screens/admin/HeroManager'

export const Route = createFileRoute('/_admin/admin/hero')({
  head: () => ({ meta: [{ title: 'TCV Bazaar Admin — HeroManager' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: Page,
})
