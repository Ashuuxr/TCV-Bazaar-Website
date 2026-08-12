import { createFileRoute } from '@tanstack/react-router'
import Portal from '@/screens/public/Portal'

export const Route = createFileRoute('/_public/portal')({
  head: () => ({
    meta: [
      { title: 'Customer Portal — TCV Bazaar' },
      { name: 'description', content: 'Track your booking status, download invoices and clear your balance from your TCV Bazaar customer portal.' },
      { property: 'og:title', content: 'Customer Portal — TCV Bazaar' },
      { property: 'og:description', content: 'Track your booking status, download invoices and clear your balance from your TCV Bazaar customer portal.' },
      { property: 'og:url', content: 'https://tcvbazaar.com/portal' },
    ],
    links: [{ rel: 'canonical', href: 'https://tcvbazaar.com/portal' }],
  }),
  component: () => <Portal />,
})
